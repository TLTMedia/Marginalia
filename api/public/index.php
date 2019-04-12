<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

date_default_timezone_set('America/New_York');

require '../vendor/autoload.php';

define("__PATH__", "../../users/");
define("__SKELETON_USER__", "../../SKELETON_USER/");

// Prepare app
$app = new \Slim\Slim(array(
    'templates.path' => '../templates',
));

// Create monolog logger and store logger in container as singleton
// (Singleton resources retrieve the same log resource definition each time)
$app->container->singleton('log', function () {
    $log = new \Monolog\Logger('slim-skeleton');
    $log->pushHandler(new \Monolog\Handler\StreamHandler('../logs/app.log', \Monolog\Logger::DEBUG));
    return $log;
});

// Prepare view
$app->view(new \Slim\Views\Twig());
$app->view->parserOptions = array(
    'charset' => 'utf-8',
    'cache' => realpath('../templates/cache'),
    'auto_reload' => true,
    'strict_variables' => false,
    'autoescape' => true
);
$app->view->parserExtensions = array(new \Slim\Views\TwigExtension());

/**
 * returns true when the values of an array are equal
 */
function array_equal($a, $b) {
    return (
         is_array($a)
         && is_array($b)
         && count($a) == count($b)
         && array_diff($a, $b) === array_diff($b, $a)
    );
}

// Define routes
$app->get('/', function () use ($app) {
    $app->log->info("Slim-Skeleton '/' route");

    $app->render('index.html');
});

/**
 * Gets a list of all the users with works...
 */
$app->get('/get_creators', function () use ($app) {
    require '../Actions/Users.php';
    $userList = new Users;

    echo $userList->getCreators();
});

/**
 * Get some data on the currently logged in user...
 *  firstName, lastName, eppn
 */
$app->get('/get_current_user', function () use ($app) {
    require '../Actions/Users.php';
    $user = new Users;

    echo $user->getCurrentUser();
});

/**
 * Get the permissions list of a specified $work of the current logged in user ($eppn)
 */
$app->get('/get_permissions_list/:work', function ($work) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
    echo $permissions->getPermissionsList($workFullPath);
});

/**
 * Add a specified user's eppn to the currently logged in users' own specified work
 */
$app->get('/add_permission/:work/:user', function ($work, $user) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
    echo $permissions->addPermission($workFullPath, $user);
});

/**
 * Remove an eppn from a works' permission file
 */
$app->get('/remove_permission/:work/:user', function ($work, $user) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
    echo $permissions->removePermission($workFullPath, $user);
});

/**
 * Get a list of the logged in users' works
 */
$app->get('/get_works/:user', function ($eppn) use ($app) {
    require '../Actions/Users.php';
    $user = new Users;
    echo $user->getUserWorks($eppn);
});

/**
 * Get a users' work file data
 */
$app->get('/get_work/:eppn/:work', function ($eppn, $work) use ($app) {
    require '../Actions/Users.php';
    $user = new Users;
    $workFullPath = __PATH__ . $eppn . "/works/" . $work . "/index.html";
    echo $user->getUserWork($workFullPath);
});

/**
 * Save a comment on a work
 */
$app->post('/save_comments', function () use ($app) {
    $json = $app->request->getBody();
    $data = json_decode($json, true);

    if (!array_equal(array_keys($data), array('visibility', 'author', 'work', 'replyTo', 'replyHash', 'startIndex', 'endIndex', 'commentText', 'commentType'))) {
        echo json_encode(array(
            "status" => "error",
            "message" => "missing a parameter"
        ));
        return;
    }

    require '../Actions/Comments.php';
    $comments = new Comments;

    echo $comments->saveComment(
        $data['author'],
        $data['work'],
        $data['replyTo'],
        $data['replyHash'],
        $_SERVER['eppn'],
        $data['startIndex'],
        $data['endIndex'],
        $data['commentText'],
        $data['commentType'],
        $data['visibility'],
        $_SERVER['nickname'],
        $_SERVER['sn']
    );
});

/**
 * Get visible comments of a work
 */
$app->get('/get_comments/:author/:work', function ($author, $work) use ($app) {
    require '../Actions/Comments.php';
    $comments = new Comments;

    // override header to ensure it's sending it as JSON (not necessary, but ensures it sends json header rather than text/html)
    $app->response->header('Content-Type', 'application/json');

    echo $comments->getComments(
        $author,
        $work
    );
});

/**
 * Delete comments
 */

/**
 * Set the permissions of a specified work
 */
$app->get('/set_privacy/:creator/:work/:privacy', function ($creator, $work, $privacy) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;

    echo $permissions->setPermissionsPrivacy(
        $creator,
        $work,
        $_SERVER['eppn'],
        $privacy
    );
});

/**
 * Create a new work
 */
$app->post('/create_work', function () use ($app) {
    $json = $app->request->getBody();

    try {
        $work = $app->request()->post('work');
        $privacy = $app->request()->post('privacy');
        $tempFile = $_FILES['file']['tmp_name'];
    } catch(Exception $e) {
        echo json_encode(array(
            "status" => "error",
            "message" => "missing parameter"
        ));
        return;
    }

    require '../Actions/CreateWork.php';
    $newWork = new CreateWork();
    echo $newWork->init(
        $_SERVER['eppn'],
        $work,
        $privacy,
        $tempFile
    );
});

/**
 * Force the server to git-pull from github develop branch
 * - Because FTP & SSH access to the 'http://apps.tlt.stonybrook.edu' is restricted from IPs not on the local network...
 */
$app->get('/git/pull/:code', function ($code) use ($app) {
    $real = file_get_contents("../../.git_secret.txt");
    $real = trim(preg_replace('/\s\s+/', '', $real));
    if ($real != $code) {
        echo json_encode(array(
            "status" => "error",
            "message" => "invalid code"
        ));
        return;
    }
    system("git pull --all");
});

$app->get('/git/status/:code', function ($code) use ($app) {
    $real = file_get_contents("../../.git_secret.txt");
    $real = trim(preg_replace('/\s\s+/', '', $real));
    if ($real != $code) {
        echo json_encode(array(
            "status" => "error",
            "message" => "invalid code"
        ));
        return;
    }
    system("git status");
});

$app->get('/system/remote/:code', function ($code) use ($app) {
    $real = file_get_contents("../../.git_secret.txt");
    $real = trim(preg_replace('/\s\s+/', '', $real));
    if ($real != $code) {
        echo json_encode(array(
            "status" => "error",
            "message" => "invalid code"
        ));
        return;
    }
    system("tar -czvf users.tar.gz ../../users");
});

// Run app
$app->run();
