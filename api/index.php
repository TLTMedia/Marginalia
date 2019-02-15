<?php

date_default_timezone_set('America/New_York');

include 'components/Parameters.php';
require('controllers/WorkDetails.php');

/** Holds the logged in user's email address */
$eppn = $_SERVER['eppn'];

/** Parameters object which holds posted data and the URL query string */
$params = new Parameters();

try {
	$method = $params->get('method');
} catch(Exception $e) {
	printf("Please define a 'method' parameter");
	exit();
}

switch ($method) {
	/**
	 * List all the different works of the logged in user
	 */
	case 'listWorks':
		new WorkDetails($eppn, $params);
		break;
	/**
	 * Get the raw html of one of the works files
	 */
	case 'workData':
		new WorkDetails($eppn, $params);
		break;
	default:
		printf("Unknown endpoint");
		break;
}
