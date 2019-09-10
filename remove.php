<?

// $data will hold all of the information found within the data subsection of
// the ajax post request


// Take the information necessary to do a double check on the user
// from there the data can be put in the respectable folder
$netid = $_SERVER['cn'];

// Gets the two points of data from the php request
$data = json_decode($_POST['data']);

// Used to check if the user is an Admin changing the contents of a user's comment
require("isAdmin.php");

$litName = $data -> textChosen;
$userFolder = $data -> userFolder;
$textChoice = "users/$userFolder/works_data/$litName/$litName";


if(!($data -> user == $netid) && !($isAdmin) || !($isRelativeAdmin)){
  file_put_contents($textChoice."_warnings/$netid"." Has Tried To Manipulate The Webpage",
  "User Has changed their ID to mask themselves as someone else, caught by the server:
  \n\n Tried to mask themselves as ".$data -> user." \n With the Comment: ".$data -> comData);
  exit(1);
}


// The specific folder that we want to remove
$timeDir = $data -> timeID;
$givenID = $data -> user;
$comCreator = $data -> comCreator;
$removalID = $data -> removalID;

// if the comment creator exists and the deleting user is an admin
if($comCreator != "" && $comCreator != $netid && ($isAdmin || $isRelativeAdmin))
{
  $userdir = $textChoice."_data/$comCreator";
}
// If it IS the admin's reply
else if($comCreator != "" && $comCreator == $netid && ($isAdmin || $isRelativeAdmin))
{
  $userdir = $textChoice."_data/$netid";
}

// if the removalID exists and the deleting user is an admin
if($removalID != "" && $removalID != $netid && ($isAdmin || $isRelativeAdmin))
{
  $userdir = $textChoice."_data/$removalID";
}
// If it IS the admin's comment
else if($removalID != "" && $removalID == $netid && ($isAdmin || $isRelativeAdmin))
{
  $userdir = $textChoice."_data/$netid";
}

$removeDir = "$userdir/$timeDir/";

// Test if the user is the one sending this data by comparing the userID
// if not then the code runs as normal
if(!($givenID == $netid) && !($isAdmin) && !($isRelativeAdmin))
{
  file_put_contents("warnings/$netid"." Has Tried To Manipulate The Webpage",
  "User Has changed their ID to mask themselves as someone else, caught by the server:
  \n\n Tried to mask themselves as ".$givenID);
  exit(1);
}
else
{

  $isReply = $data -> isReply;
  if($isReply)
  {
    $replyID = $data -> replyID;
    $direct = $data -> directoryPath;
    $replyFile = "$userdir/$direct/$direct"."_replies/".$replyID."_reply";
    unlink($replyFile);
  }
  else
  {
    exec("rm -rf $removeDir");
    if(count(glob("$userdir/*")) == 0)
    {
      exec("rm -rf $userdir");
    }
  }
}

?>
