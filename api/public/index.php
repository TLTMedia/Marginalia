<?php
header("Access-Control-Allow-Origin: *");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Necessary b/c of server PHP config
date_default_timezone_set('America/New_York');

require '../vendor/autoload.php';
require '../Common/Parameters.php';
require '../Common/APIResponse.php';

// Create the Global Object Variables
$Parameters = new Parameters;
$APIResponse = new APIResponse;

// Define Global Constants Used
define("__PATH__", "../../users/");
define("__SKELETON_USER__", "../../SKELETON_USER/");

/**
 * Prepare App
 */
$app = new \Slim\Slim(array(
	'templates.path' => '../templates',
));

/**
 * Create monolog logger and store logger in container as singleton
 * (Singleton resources retrieve the same log resource definition each time)
 * See Log Levels: https://github.com/Seldaek/monolog/blob/master/doc/01-usage.md
 */
$app->container->singleton('log', function () {
	$log = new \Monolog\Logger('Marginalia');
	$log->pushHandler(new \Monolog\Handler\StreamHandler('../logs/app.log', \Monolog\Logger::DEBUG));
	return $log;
});

/**
 * Prepare view
 */
$app->view(new \Slim\Views\Twig());
$app->view->parserOptions = array(
	'charset' => 'utf-8',
	'cache' => realpath('../templates/cache'),
	'auto_reload' => true,
	'strict_variables' => false,
	'autoescape' => true
);
$app->view->parserExtensions = array(new \Slim\Views\TwigExtension());

// Define routes
$app->get('/', function () use ($app) {
    $app->log->info("Marginalia '/' route called");
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
	echo $user->getCurrentUser(
        $_SERVER['nickname'],
        $_SERVER['sn'],
        $_SERVER['eppn']
    );
});

/**
 * Get the permissions list of a specified $work of the current logged in user ($eppn)
 */
$app->get('/get_permissions_list/:eppn/:work', function ($eppn, $work) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = __PATH__ . $eppn . "/works/" . $work;
    echo $permissions->getPermissionsList($workFullPath);
});

/**
 * Add a specified user's eppn to the currently logged in users' own specified work
 */
$app->get('/add_permission/:work/:user', function ($work, $user) use ($app) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	$workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
	echo $permissions->addPermission(
        $workFullPath,
        $user
    );
});

/**
 * Remove an eppn from a works' permission file
 */
$app->get('/remove_permission/:work/:user', function ($work, $user) use ($app) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	$workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
	echo $permissions->removePermission(
        $workFullPath,
        $user
    );
});

/**
 * Get a list of the specified users' works
 */
$app->get('/get_works/:user', function ($eppn) use ($app) {
	require '../Actions/Users.php';
	$user = new Users;
	echo $user->getUserWorks(
        $eppn,
        $_SERVER['eppn']
    );
});

/**
 * Get a specified users' work data
 */
$app->get('/get_work/:eppn/:work', function ($eppn, $work) use ($app) {
	require '../Actions/Users.php';
	$user = new Users;
	$workFullPath = __PATH__ . $eppn . "/works/" . $work;
	echo $user->getUserWork(
        $workFullPath,
        $_SERVER['eppn']
    );
});

/**
 * Save a comment on a work
 */
$app->post('/save_comments', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "author", "work", "replyTo", "replyHash", "startIndex", "endIndex", "commentText", "commentType", "visibility"
    ));

    require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["author"], $data["work"]);
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
 * Save a comment on a work
 */
$app->post('/edit_comment', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash", "type", "text", "public"
    ));

	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["creator"], $data["work"]);
	echo $comments->editComment(
		$data['creator'],
		$data['work'],
		$data['commenter'],
		$data['hash'],
		$data['type'],
		$data['text'],
		$data['public'],
		$_SERVER['eppn']
	);
});

/**
 * Get highlights/first level comment meta data (not the text of the comment)
 */
$app->get('/get_highlights/:author/:work', function ($creator, $work) use ($app) {
	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $creator, $work);
    // TODO test to see if this is necessary
	$app->response->header('Content-Type', 'application/json');
	echo $comments->getHighlights(
		$creator,
		$work,
		$_SERVER['eppn']
	);
});

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
 * Sets whether a works' comments require approval or not
 */
$app->get('/set_require_approval/:creator/:work/:approval', function ($creator, $work, $approval) use ($app) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	echo $permissions->setWorkRequiresApproval(
		$creator,
		$work,
		$_SERVER['eppn'],
		$approval
	);
});

/**
 * Create a new work
 */
$app->post('/create_work', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
    // TODO test to see if I can replace this with $Parameters->paramCheck()
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
 * Set an existing comment public/privacy status
 * If the current user is on the permissions list, then it's auto-approved.
 */
$app->post('/set_comment_public', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "creator", "work", "comment_hash", "public"
    ));

	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["creator"], $data["work"]);
	echo $comments->setCommentPublic(
		$data['creator'],
		$data['work'],
		$data['comment_hash'],
		$_SERVER['eppn'],
		$data['public']
	);
});

/**
 * Approve a comment for public viewing
 */
$app->post('/approve_comment', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "creator", "work", "commenterEppn", "comment_hash"
    ));

	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["creator"], $data["work"]);
	echo $comments->approveComment(
		$_SERVER['eppn'],
		$data['creator'],
		$data['work'],
		$data['comment_hash'],
		$data['commenterEppn']
	);
});

/**
 * Set an existing comment public/privacy status
 */
$app->post('/get_comment_chain', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash"
    ));

	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["creator"], $data["work"]);
	echo $comments->getCommentChain(
        $data['creator'],
        $data['work'],
        $data['commenter'],
        $data['hash'],
        $_SERVER['eppn']
    );
});

/**
 * Delete comment
 */
$app->post('/delete_comment', function () use ($app, $Parameters) {
	$json = $app->request->getBody();
	$data = json_decode($json, true);
    $Parameters->paramCheck($data, array(
        "creator", "work", "commenter", "hash"
    ));

	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $data["creator"], $data["work"]);
	echo $comments->deleteComment(
		$data['creator'],
		$data['work'],
		$data['commenter'],
		$data['hash'],
		$_SERVER['eppn']
	);
});

/**
 * Checks whether the currently logged in user can view the specified work
 */
$app->get('/has_access/:creator/:work', function ($creator, $work) use ($app) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	echo $permissions->canUserViewWork(
		$creator,
		$work,
		$_SERVER['eppn']
	);
});

/**
 * Checks whether the specified work is public, regardless of who the user is
 */
$app->get('/is_public/:creator/:work', function ($creator, $work) use ($app, $APIResponse) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	$workFullPath = __PATH__ . $creator . "/works/" . $work;
	echo $APIResponse->data("ok",
		$permissions->isWorkPublic(
			$workFullPath
		)
	);
});

/**
 * Checks whether the specified work's comment need approval, regardless of who the user is
 */
$app->get('/is_comments_require_approval/:creator/:work', function ($creator, $work) use ($app, $APIResponse) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	$workFullPath = __PATH__ . $creator . "/works/" . $work;
	echo $APIResponse->data("ok",
		$permissions->commentsNeedsApproval(
			$workFullPath
		)
	);
});

/**
 * Checks whether the currently logged in user can comment without requiring approval.
 * In addition, it first checks whether the user can even access the work.
 * return fasle if don't need to get approved, return true if needed to get approved
 */
$app->get('/comments_need_approval/:creator/:work', function ($creator, $work) use ($app) {
	require '../Actions/Permissions.php';
	$permissions = new Permissions;
	echo $permissions->canCommentWithoutApproval(
		$creator,
		$work,
		$_SERVER['eppn']
	);
});

/**
 * Gets a list of the unapproved comments of a specified work.
 */
$app->get('/unapproved_comments/:creator/:work', function ($creator, $work) use ($app, $APIResponse) {
	require '../Actions/UnapprovedComments.php';
	$unapprovedComments = new UnapprovedComments($app->log, __PATH__, $creator, $work);
	echo $APIResponse->message("ok",
		$unapprovedComments->getAllUnapprovedCommentData()
	);
});

/**
 * Temp function to create the unapproved directory for a work
 */
$app->get('/unapproved_init/:creator/:work', function ($creator, $work) use ($app, $APIResponse) {
	require '../Actions/Comments.php';
	$comments = new Comments($app->log, __PATH__, $creator, $work);
	$comments->tempFunctionToCreateUnapprovedDirs($creator, $work);
});

/**
 * Force the server to git-pull from github develop branch
 * - Because FTP & SSH access to the 'http://apps.tlt.stonybrook.edu' is restricted from IPs not on the local network...
 */
$app->get('/git/pull/:code', function ($code) use ($app) {
	$real = file_get_contents("../../.git_secret.txt");
	$real = trim(preg_replace('/\s\s+/', '', $real));
	if ($real != $code) {
		$APIResponse->printMessage(
			"error",
			"invalid code"
		);
		return;
	}
	system("git pull --all");
});

// Run app
$app->run();
