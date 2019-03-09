<?php
date_default_timezone_set('America/New_York');
// $data will hold all of the information found within the data subsection of
// the ajax post request

// Take the information necessary to do a double check on the user
// from there the data can be put in the respectable folder
$netid = $_SERVER['eppn'];


// Take the data given in the post ajax call and decode it in a json format
// The only data saved in a comment are the user, type and comData parts
$data = json_decode($_POST['data']);
$litName = $data->textChosen;
$userFolder = $data->userFolder;
$textChoice = "users/$userFolder/works_data/$litName/$litName";

// Used to check if the user is an Admin changing the contents of a user's comment
$localAdmin = $userFolder;
//require("isAdmin.php");

$sendData -> isVisible = "true";
// if(($isAdmin || $isRelativeAdmin))
// {
//   $sendData -> isVisible = "true";
// }
// else
// {
//   $sendData -> isVisible = "false";
// }

//file_put_contents("phpdebug/$userFolder-Test-Input-Debug-$netid.txt","$isRelativeAdmin\n$isAdmin\n".$sendData -> isVisible);
// Test if the user is the one sending this data by comparing the userID
// if not then the code runs as normal
// if(!($data -> user == $netid) && !(($isAdmin || $isRelativeAdmin))){
//   file_put_contents($textChoice."_warnings/$netid"." Has Tried To Manipulate The Webpage",
//   "User Has changed their ID to mask themselves as someone else, caught by the server:
//   \n\n Tried to mask themselves as ".$data -> user." \n With the Comment: ".$data -> comData);
//   exit(1);
// }
// else
// {
// Gives a unique ID to the file that will assist in ordering
$fileOrder = $data -> timeStamp;

// Puts information into the comment's file
$userID = $data -> user;
$comData = $data -> comData;
$type = $data -> type;
$startIndex = $data -> startDex;
$endIndex = $data -> endDex;
$firstname = $data -> firstname;
$lastname = $data -> lastname;

// Specify the directory in whch the file is placed
$userdir = $textChoice."_data/$userID";
echo $textChoice . "< THIS WAS TEXT CHOICE\n";
echo $userdir . "< THIS WAS USER DIR\n";
// Set some information to specific variables
$sendData -> userID = $data -> user;
$sendData -> commentData = $comData;
$sendData -> type = $type;
$sendData -> startIndex = $startIndex;
$sendData -> endIndex = $endIndex;
$sendData -> timeStamp = $fileOrder;
$sendData -> firstname = $firstname;
$sendData -> lastname = $lastname;

// Set the comment directory
$threadDirectory = "$userdir/$fileOrder";

// Set the directory of the user and make one if it doesn't exist
if($fileOrder != "")
{
  if (!file_exists($userdir)) {
      mkdir($userdir);
  }

  // Set the directory of the output and make one if it doesn't exist
  if (!file_exists($threadDirectory)) {
      mkdir($threadDirectory);
  }
  // Set the directory of the replies if one doesn't exist
  if(!file_exists("$userdir/$fileOrder/$fileOrder"."_replies"))
  {
    mkdir("$userdir/$fileOrder/$fileOrder"."_replies");
  }

  // Finally place the new file within the folder, check if it's an edit first though
  file_put_contents("$userdir/$fileOrder/$fileOrder"."_comment",json_encode($sendData));
}

//}
?>
