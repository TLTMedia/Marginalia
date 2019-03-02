<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

date_default_timezone_set('America/New_York');

require '../vendor/autoload.php';

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

// Define routes
$app->get('/', function () use ($app) {
    $app->log->info("Slim-Skeleton '/' route");

    $app->render('index.html');
});

/**
 * Gets a list of all the users with works...
 */
$app->get('/get_users', function () use ($app) {
    require '../Actions/Users.php';
    $userList = new Users;

    echo $userList->getUsers();
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
    $workFullPath = "../../users/" . $_SERVER['eppn'] . "/works_data/" . $work;
    echo $permissions->getPermissionsList($workFullPath);
});

/**
 * Add a specified user's eppn to the currently logged in users' own specified work
 */
$app->get('/add_permission/:work/:user', function ($work, $user) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = "../../users/" . $_SERVER['eppn'] . "/works_data/" . $work;
    echo $permissions->addPermission($workFullPath, $user);
});

/**
 * Remove an eppn from a works' permission file
 */
$app->get('/remove_permission/:work/:user', function ($work, $user) use ($app) {
    require '../Actions/Permissions.php';
    $permissions = new Permissions;
    $workFullPath = "../../users/" . $_SERVER['eppn'] . "/works_data/" . $work;
    echo $permissions->removePermission($workFullPath, $user);
});

/**
 * Get a list of the logged in users' works
 */
$app->get('/get_works', function () use ($app) {
     require '../Actions/Users.php';
     $user = new Users;
     echo $user->getUserWorks();
 });

// Run app
$app->run();
