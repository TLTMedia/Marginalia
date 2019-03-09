<?php

// Necessary to prevent timezone error b/c invalid php.ini config
// https://stackoverflow.com/questions/16765158/date-it-is-not-safe-to-rely-on-the-systems-timezone-settings
date_default_timezone_set('America/New_York');

$eppn = $_SERVER['eppn'];

$data = json_decode($_GET['data']);

$userFolder = $data -> userFolder;
$work = $data -> work;

$sourceFile = "users/$eppn/works/$work/index.html";

$text = file_get_contents($sourceFile);

print $text;
