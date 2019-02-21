<?php
// TODO: $private & || $moderated functionality...

// This will save the given data as new text files with their new names

// Necessary to prevent timezone error b/c invalid php.ini config
// https://stackoverflow.com/questions/16765158/date-it-is-not-safe-to-rely-on-the-systems-timezone-settings
date_default_timezone_set('America/New_York');
header('Content-Type: application/json');

$eppn = $_SERVER['eppn'];
$data = $_FILES['file'];
$name = $_POST['litname'];
$private = $_POST['private'];

// Check if every necessary folder and file exists
$userFolder = "users/$eppn";

if (!file_exists($userFolder)) {
    mkdir($userFolder);
    mkdir("$userFolder/works");
    mkdir("$userFolder/works_data");
    mkdir("$userFolder/tmp");
}

if (!file_exists("$userFolder/works_data/$name")) {
    mkdir("$userFolder/works_data/$name");
    mkdir("$userFolder/works_data/$name/$name"."_warnings");
    mkdir("$userFolder/works_data/$name/$name"."_data");
    file_put_contents("$userFolder/${eppn}_whitelist", $eppn);
}

if ($private) {
    file_put_contents("$userFolder/works_data/$name/moderatedPage", $eppn);
}

// Get uploaded file data & write it to users tmp dir
$content = file_get_contents($_FILES['file']['tmp_name']);
$tmpFile = "$userFolder/tmp/${name}.docx";
file_put_contents($tmpFile , $content);

// Get the temp file that was just created and convert it using mammoth (w/specified output location)
$execString = "/home1/tltsecure/.local/bin/mammoth $tmpFile $userFolder/works/${name}.html";
system($execString);

// Cleanup (remove the tmp file)
if (!unlink($tmpFile)) {
    echo json_encode(array("status" => "error", "message" => "Error deleting user tmp file: $tmpFile"));
}

echo json_encode(array("status" => "success"));
