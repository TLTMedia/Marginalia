<?
// gets all files in this folder
header('Content-Type: application/json');

$literature = $_GET["text"];
$userFolder = $_GET["userFolder"];

$user = json_decode("{}");
$user -> firstname = $_SERVER['nickname'];
$user -> lastname = $_SERVER['sn'];
$user -> netid = $_SERVER['cn'];
$data = json_decode("{}");
$textChoice = "users/$userFolder/works_data/$literature/$literature"."_data/*";

// The JSON made will have a directory of names
// each name will then have a directory of testFolder names as key
// the value for each key will then be the json_encoded comment
// all saved into data

$arrayOfComments = load_files($textChoice);
$data -> userLoggedIn = $user;
$data -> arrayOfComments = $arrayOfComments;
print json_encode($data);
// To load the files we:
// Load the netid folders
// Go through each timeStamp folder
// take the contents of the _reply and _comment file/directory
function load_files($serverSource)
{
  $allUserData = array();
  // Load the netIDs
  $userData = glob($serverSource);
    foreach($userData as $netIDFolder)
    {

      $netID= split("/",$netIDFolder);
      $netID=$netID[5];
      $userObject = json_decode("{}");
      $userObject-> netID =$netID;
      $commentDataArray= array();
      $userFolder = glob($netIDFolder."/*");
      // Load the folders in the user folder
      foreach ($userFolder as $commentFolder)
      {
        $pathArray= split("/",$commentFolder);

        $pathStem= "$commentFolder/${pathArray[6]}";
        $commentData=json_decode(file_get_contents("${pathStem}_comment"));
        //print("\n"."${pathStem}_comment");
        $commentReplies= glob("${pathStem}_replies/*");
        $repliesDataArray= array();
        foreach ($commentReplies as $commentReply)
        {
          //print("$commentReply<br/>");
          $replyData=file_get_contents($commentReply);
          array_push ($repliesDataArray,$replyData);
        }
        $commentData->replies=$repliesDataArray;
       array_push ($commentDataArray, $commentData);
      }
      $userObject->comments=$commentDataArray;
       array_push ($allUserData, $userObject);
    }
    return $allUserData;
}
?>
