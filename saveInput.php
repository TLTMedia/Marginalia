<?php
// This will save the given data as new text files with their new names

$netid = $_SERVER['cn'];

// Load the name and the contents
$data = json_decode($_POST['data']);
$name = $data -> wordName;
$folder = $data -> userFolder;
$content = $data-> wordFile;
$moderated = $data-> isModerated;
$reformat ="";

if ($folder != $netid && $folder != "") {
    file_put_contents(
      "phpdebug/$netid"." Has Tried To Manipulate The Webpage",
      "User Has changed their ID to mask themselves as someone else, caught by the server:
  \n\n Tried to mask themselves as ".$folder." and tried to put a text file named: ".$name
  );
} else {
    // Check if every necessary folder and file exists
    if (!file_exists("users/$folder")) {
        mkdir("users/$folder");
        mkdir("users/$folder/works");
        mkdir("users/$folder/works_data");
    }
    if (!file_exists("users/$folder/works_data/$name")) {
        mkdir("users/$folder/works_data/$name");
        mkdir("users/$folder/works_data/$name/$name"."_warnings");
        mkdir("users/$folder/works_data/$name/$name"."_data");
        file_put_contents("users/$folder/$folder"."_whitelist", $folder);
    }
    if ($moderated) {
        file_put_contents("users/$folder/works_data/$name/moderatedPage", "$netid");
    }
    // $reformat = reformatText($content);

    //file_put_contents("phpdebug/$name-Test-Input-Debug.txt",$content);
    file_put_contents("users/$folder/works/$name".".docx", $content);
    //print json_encode($content);
}
