<?php
header("Access-Control-Allow-Origin: *");

ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

// Necessary b/c of server PHP config
date_default_timezone_set("America/New_York");

require "../vendor/autoload.php";
require "../Common/Parameters.php";
require "../Common/APIResponse.php";

// Create the Object Variables
$parameters  = new Parameters;
$responseFmt = new APIResponse;

// Define String Constants
$PATH          = "../../users/";
$SKELETON_PATH = "../../SKELETON_USER/";

// Rereference Shibboleth Globals used
// Provides a bit of code-space away from Shibboleth,
// so that we can use other auth types in the future...
// Relocates hard coded $_SERVER[...] vars in the code below to up top here.
$authUniqueId  = $_SERVER["eppn"];
$authFirstName = $_SERVER["nickname"];
$authLastName  = $_SERVER["sn"];
/**
 * Prepare App
 */
$app = new \Slim\Slim(array(
    "templates.path" => "../templates",
));

/**
 * Create monolog logger and store logger in container as singleton
 * (Singleton resources retrieve the same log resource definition each time)
 * See Log Levels: https://github.com/Seldaek/monolog/blob/master/doc/01-usage.md
 */
$app->container->singleton("log", function () {
    $log = new \Monolog\Logger("Marginalia");
    $log->pushHandler(new \Monolog\Handler\StreamHandler("../logs/app.log", \Monolog\Logger::DEBUG));
    return $log;
});

/**
 * Prepare view
 */
$app->view(new \Slim\Views\Twig());
$app->view->parserOptions = array(
    "charset"          => "utf-8",
    "cache"            => realpath("../templates/cache"),
    "auto_reload"      => true,
    "strict_variables" => false,
    "autoescape"       => true,
);
$app->view->parserExtensions = array(new \Slim\Views\TwigExtension());

// Define routes
$app->get("/", function () use ($app) {
    $app->log->info("Marginalia '/' route called");
    $app->render("index.html");
});

/**
 * Gets a list of all the users with works...
 */
$app->get("/get_creators", function () use ($app, $PATH) {
    require "../Actions/Users.php";
    $users = new Users($PATH);

    echo $users->getCreators();
});

/**
 * Get some data on the currently logged in user...
 *  firstName, lastName, eppn
 */
$app->get("/get_current_user", function () use ($app, $PATH, $authUniqueId, $authFirstName, $authLastName) {
    require "../Actions/Users.php";
    $users = new Users($PATH);

    echo $users->getCurrentUser(
        $authFirstName,
        $authLastName,
        $authUniqueId
    );
});

/**
 * Get the permissions list of a specified $work of the current logged in user ($eppn)
 */
$app->get("/get_permissions_list", function () use ($app, $PATH, $parameters) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "eppn", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions  = new Permissions($PATH);
    $workFullPath = $PATH . $data["eppn"] . "/works/" . $data["work"];

    echo $permissions->getPermissionsList(
        $workFullPath
    );
});

/**
 * Add a specified user's eppn to the currently logged in users' own specified work
 */
$app->post("/add_permission", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "eppn", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions  = new Permissions($PATH);
    $workFullPath = $PATH . $authUniqueId . "/works/" . $data["work"];

    echo $permissions->addPermission(
        $workFullPath,
        $data["user"]
    );
});

/**
 * Remove an eppn from a works' permission file
 *
 * NOTE: $app->delete() isn't supported with the slim version we're using (slim 2)
 */
$app->post("/remove_permission", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "eppn", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions  = new Permissions($PATH);
    $workFullPath = $PATH . $authUniqueId . "/works/" . $data["work"];

    echo $permissions->removePermission(
        $workFullPath,
        $data["eppn"]
    );
});

/**
 * Get a list of the specified users' works
 */
$app->get("/get_works", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "eppn",
    ));

    require "../Actions/Users.php";
    $users = new Users($PATH);

    echo $users->getUserWorks(
        $data["eppn"],
        $authUniqueId
    );
});

/**
 * Get a specified users' work data
 */
$app->get("/get_work", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "eppn", "work",
    ));

    require "../Actions/Users.php";
    $users        = new Users($PATH);
    $workFullPath = $PATH . $data["eppn"] . "/works/" . $data["work"];

    echo $users->getUserWork(
        $workFullPath,
        $authUniqueId
    );
});

/**
 * Save a comment on a work
 */
$app->post("/save_comments", function () use ($app, $PATH, $parameters, $authUniqueId, $authFirstName, $authLastName) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "author", "work", "replyTo", "replyHash", "startIndex", "endIndex", "commentText", "commentType", "visibility",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["author"], $data["work"]);

    echo $comments->saveComment(
        $data["author"],
        $data["work"],
        $data["replyTo"],
        $data["replyHash"],
        $authUniqueId,
        $data["startIndex"],
        $data["endIndex"],
        $data["commentText"],
        $data["commentType"],
        $data["visibility"],
        $authFirstName,
        $authLastName
    );
});

/**
 * Save a comment on a work
 */
$app->post("/edit_comment", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash", "type", "text", "public",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->editComment(
        $data["creator"],
        $data["work"],
        $data["commenter"],
        $data["hash"],
        $data["type"],
        $data["text"],
        $data["public"],
        $authUniqueId
    );
});

/**
 * Get highlights/first level comment meta data (not the text of the comment)
 */
$app->get("/get_highlights", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->getHighlights(
        $data["creator"],
        $data["work"],
        $authUniqueId
    );
});

/**
 * Get highlights/first level comment meta data (not the text of the comment)
 */
$app->get("/get_highlights_filtered", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work", "filterEppn", "filterType",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->getHighlightsFiltered(
        $data["creator"],
        $data["work"],
        $authUniqueId,
        $data["filterEppn"],
        $data["filterType"]
    );
});

/**
 * Set the permissions of a specified work
 */
$app->post("/set_privacy", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "privacy",
    ));

    require "../Actions/Permissions.php";
    $permissions = new Permissions($PATH);

    echo $permissions->setPermissionsPrivacy(
        $data["creator"],
        $data["work"],
        $authUniqueId,
        $data["privacy"]
    );
});

/**
 * Sets whether a works" comments require approval or not
 */
$app->post("/set_require_approval", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "approval",
    ));

    require "../Actions/Permissions.php";
    $permissions = new Permissions($PATH);

    echo $permissions->setWorkRequiresApproval(
        $data["creator"],
        $data["work"],
        $authUniqueId,
        $data["approval"]
    );
});

/**
 * Create a new work
 */
$app->post("/create_work", function () use ($app, $PATH, $SKELETON_PATH, $parameters, $authUniqueId) {
    $data = $app->request->post();
    $parameters->paramCheck($data, array(
        "work", "privacy",
    ));

    try {
        $tempFile = $_FILES["file"]["tmp_name"];
    } catch (Exception $e) {
        echo json_encode(array(
            "status"  => "error",
            "message" => "no file appears to have been uploaded",
        ));
        exit;
    }

    require "../Actions/CreateWork.php";
    $newWork = new CreateWork($PATH, $SKELETON_PATH);

    echo $newWork->init(
        $authUniqueId,
        $data["work"],
        $data["privacy"],
        $tempFile
    );
});

/**
 * Set an existing comment public/privacy status
 * If the current user is on the permissions list, then it"s auto-approved.
 */
$app->post("/set_comment_public", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "comment_hash", "public",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->setCommentPublic(
        $data["creator"],
        $data["work"],
        $data["comment_hash"],
        $authUniqueId,
        $data["public"]
    );
});

/**
 * Approve a comment for public viewing
 */
$app->post("/approve_comment", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "commenterEppn", "comment_hash",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->approveComment(
        $authUniqueId,
        $data["creator"],
        $data["work"],
        $data["comment_hash"],
        $data["commenterEppn"]
    );
});

/**
 * Set an existing comment public/privacy status
 */
$app->get("/get_comment_chain", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->getCommentChain(
        $data["creator"],
        $data["work"],
        $data["commenter"],
        $data["hash"],
        $authUniqueId
    );
});

/**
 * Delete comment
 */
$app->post("/delete_comment", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = json_decode($app->request->getBody(), true);
    $parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->deleteComment(
        $data["creator"],
        $data["work"],
        $data["commenter"],
        $data["hash"],
        $authUniqueId
    );
});

/**
 * Checks whether the currently logged in user can view the specified work
 */
$app->get("/has_access", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions = new Permissions($PATH);

    echo $permissions->canUserViewWork(
        $data["creator"],
        $data["work"],
        $authUniqueId
    );
});

/**
 * Checks whether the specified work is public, regardless of who the user is
 */
$app->get("/is_public", function () use ($app, $PATH, $parameters, $responseFmt) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions  = new Permissions($PATH);
    $workFullPath = $PATH . $data["creator"] . "/works/" . $data["work"];

    echo $responseFmt->data(
        $permissions->isWorkPublic(
            $workFullPath
        )
    );
});

/**
 * Checks whether the specified work"s comment need approval, regardless of who the user is
 */
$app->get("/is_comments_require_approval", function () use ($app, $PATH, $parameters, $responseFmt) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions  = new Permissions($PATH);
    $workFullPath = $PATH . $data["creator"] . "/works/" . $data["work"];

    echo $responseFmt->data(
        $permissions->commentsNeedsApproval(
            $workFullPath
        )
    );
});

/**
 * Checks whether the currently logged in user can comment without requiring approval.
 * In addition, it first checks whether the user can even access the work.
 * return fasle if don"t need to get approved, return true if needed to get approved
 */
$app->get("/comments_need_approval", function () use ($app, $PATH, $parameters, $authUniqueId) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Permissions.php";
    $permissions = new Permissions($PATH);

    echo $permissions->canCommentWithoutApproval(
        $data["creator"],
        $data["work"],
        $authUniqueId
    );
});

/**
 * Gets a list of the unapproved comments of a specified work.
 */
$app->get("/unapproved_comments", function () use ($app, $PATH, $parameters, $responseFmt) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/UnapprovedComments.php";
    $unapproved = new UnapprovedComments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $responseFmt->message(
        $unapproved->getAllUnapprovedCommentData()
    );
});

/**
 * Temp function to create the unapproved directory for a work
 *
 * NOTE: this function is used when there"s a discrepency between work unapproved registry
 * and the individual comment privacy properties of each comment object.
 * Does not check for user authentication - hence it should be commented out after use.
 */
$app->get("/unapproved_init", function () use ($app, $PATH, $parameters) {
    $data = $app->request->get();
    $parameters->paramCheck($data, array(
        "creator", "work",
    ));

    require "../Actions/Comments.php";
    $comments = new Comments($app->log, $PATH, $data["creator"], $data["work"]);

    echo $comments->tempFunctionToCreateUnapprovedDirs(
        $data["creator"],
        $data["work"]
    );
});

/**
 * Force the server to git-pull from github develop branch
 * - Because FTP & SSH access to the "http://apps.tlt.stonybrook.edu" is restricted from IPs not on the local network...
 */
$app->get("/git/pull/:code", function ($code) use ($app, $responseFmt) {
    $real = file_get_contents("../../.git_secret.txt");
    $real = trim(preg_replace("/\s\s+/", "", $real));
    if ($real != $code) {
        $app->log->info("git pull was called but did not authenticate");
        $responseFmt->printMessage(
            "invalid code",
            "error"
        );
        exit;
    }
    $app->log->warn("git pull was called successfully");
    system("git pull --all");
});

// Run app
$app->run();
