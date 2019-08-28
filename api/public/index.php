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

		echo $user->getCurrentUser($_SERVER['nickname'], $_SERVER['sn'], $_SERVER['eppn']);
});

/**
 * Get the permissions list of a specified $work of the current logged in user ($eppn)
 */
$app->get('/get_permissions_list/:eppn/:work', function ($eppn,$work) use ($app) {
		require '../Actions/Permissions.php';
		$permissions = new Permissions;
	//  $workFullPath = __PATH__ . $_SERVER['eppn'] . "/works/" . $work;
		$workFullPath = __PATH__ .$eppn. "/works/" . $work;
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
		echo $user->getUserWorks($eppn, $_SERVER['eppn']);
});

/**
 * Get a users' work file data
 */
$app->get('/get_work/:eppn/:work', function ($eppn, $work) use ($app) {
		require '../Actions/Users.php';
		$user = new Users;
		$workFullPath = __PATH__ . $eppn . "/works/" . $work;
		echo $user->getUserWork($workFullPath, $_SERVER['eppn']);
});

/**
 * Save a comment on a work
 */
$app->post('/save_comments', function () use ($app) {
		$json = $app->request->getBody();
		$data = json_decode($json, true);

		require '../Actions/Comments.php';
		$comments = new Comments($data["author"], $data["work"]);

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
$app->post('/edit_comment', function () use ($app) {
		$json = $app->request->getBody();
		$data = json_decode($json, true);

		if (!array_equal(array_keys($data), array("creator", "work", "commenter", "hash", "type", "text", "public"))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "missing a parameter"
				));
				return;
		}

		require '../Actions/Comments.php';
		$comments = new Comments($data["creator"], $data["work"]);

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
		$comments = new Comments($creator, $work);

		// override header to ensure it's sending it as JSON (not necessary, but ensures it sends json header rather than text/html)
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

// TODO set commentsNeedApproval of a specified work
$app->get('/set_CNA/:creator/:work/:approval', function ($creator, $work, $approval) use ($app) {
		require '../Actions/Permissions.php';
		$permissions = new Permissions;

		echo $permissions->setPermissionsCNA(
				$creator,
				$work,
				$_SERVER['eppn'],
				$approval
		);
});

// TODO function not working
//(check the work's privacy)
// $app->get('/is_work_public/:eppn/:work', function ($eppn, $work) use ($app){
//   require '../Actions/Permissions.php';
//   $permissions = new Permissions;
//   $workFullPath = __PATH__ . $eppn . "/works/" . $work;
//   echo $permissions->isWorkPublic($workFullPath);
// });

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
 * Set an existing comment public/privacy status
 */
$app->post('/set_comment_public', function () use ($app) {
		$json = $app->request->getBody();
		$data = json_decode($json, true);
		if (!array_equal(array_keys($data), array("creator", "work", "comment_hash", "public"))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "missing a parameter"
				));
				return;
		}

		require '../Actions/Comments.php';
		$comments = new Comments($data["creator"], $data["work"]);

		/**
		 * TODO: move this to inside setCommentPublic
		 */
		if (!in_array(json_encode($data['public']), array('true', 'false'))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "unable to edit comment"
				));
				return;
		}

		echo $comments->setCommentPublic(
				$data['creator'],
				$data['work'],
				$data['comment_hash'],
				$_SERVER['eppn'],
				$data['public']
		);
});

// TODO might need some edit
$app->post('/approve_comment',function() use ($app){
		$json = $app->request->getBody();
		$data = json_decode($json, true);
		if (!array_equal(array_keys($data), array("creator", "work", "commenterEppn", "comment_hash", "approved"))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "missing a parameter"
				));
				return;
		}

		require '../Actions/Comments.php';
		$comments = new Comments($data["creator"], $data["work"]);

		if (!in_array(json_encode($data['approved']), array('true', 'false'))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "unable to edit comment"
				));
				return;
		}

		echo $comments->approvedComment(
				$data['creator'],
				$data['work'],
				$data['comment_hash'],
				$data['commenterEppn'],
				$data['approved']
		);
});

/**
 * Set an existing comment public/privacy status
 */
$app->post('/get_comment_chain', function () use ($app) {
		$json = $app->request->getBody();
		$data = json_decode($json, true);
		if (!array_equal(array_keys($data), array("creator", "work", "commenter", "hash"))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "missing a parameter"
				));
				return;
		}

		require '../Actions/Comments.php';
		$comments = new Comments($data["creator"], $data["work"]);

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
$app->post('/delete_comment', function () use ($app) {
		$json = $app->request->getBody();
		$data = json_decode($json, true);
		if (!array_equal(array_keys($data), array("creator", "work", "commenter", "hash"))) {
				echo json_encode(array(
						"status" => "error",
						"message" => "missing a parameter"
				));
				return;
		}

		require '../Actions/Comments.php';
		$comments = new Comments($data["creator"], $data["work"]);

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

		$workFullPath = __PATH__ . $creator . "/works/" . $work;
		if ($permissions->isWorkPublic($workFullPath)) {
				echo json_encode(array(
						"access" => "true"
				));
		} else {
				if ($permissions->userOnPermissionsList($workFullPath, $_SERVER['eppn'])) {
						echo json_encode(array(
								"access" => "true"
						));
				} else {
						echo json_encode(array(
								"access" => "false"
						));
				}
		}
});

/**
 * Checks whether the currently logged in user can comment without requiring approval.
 * In addition, it first checks whether the user can even access the work.
 */
$app->get('/comments_need_approval/:creator/:work', function ($creator, $work) use ($app) {
		require '../Actions/Permissions.php';
		$permissions = new Permissions;

		$workFullPath = __PATH__ . $creator . "/works/" . $work;
		if ($permissions->isWorkPublic($workFullPath)) {
				if ($permissions->commentsNeedsApproval($workFullPath)) {
						if ($permissions->userOnPermissionsList($workFullPath, $_SERVER['eppn'])) {
								echo json_encode(array(
										"needApproval" => "false"
								));
						} else {
								echo json_encode(array(
										"needApproval" => "true"
								));
						}
				} else {
						echo json_encode(array(
								"needApproval" => "false"
						));
				}
		} else {
				if ($permissions->userOnPermissionsList($workFullPath, $_SERVER['eppn'])) {
						// current user is on the permission list, so even if comments required approval - they'd be able to comment without requiring it...
						// Hence, we don't need to even check if comments require approval here.
						echo json_encode(array(
								"needApproval" => "false"
						));
				} else {
						echo json_encode(array(
								"needApproval" => "true"
						));
				}
		}
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

// Run app
$app->run();
