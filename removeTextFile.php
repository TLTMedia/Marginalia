<?
// The user's folder that we're removing the file from
$netid = $_SERVER['cn'];

// The work file
$text = $_POST['data'];

// The text file and the data along with it
$textFile = "users/$netid/works/$text.txt";
$textFileData = "users/$netid/works_data/$text/";

if($textFileData == "" || $textFile == "")
{
  file_put_contents("phpdebug/$netid"."-Removal-Debug.txt","$textFile\n"."$textFileData\n"."$text");
  exit(1);
}
else if(file_exists($textFileData))
{
   // Removal of both files
   exec("rm -rf $textFileData");
   exec("rm $textFile");
}
?>
