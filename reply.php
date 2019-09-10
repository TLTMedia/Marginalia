<?

// $data will hold all of the information found within the data subsection of
// the ajax post request

// Take the information necessary to do a double check on the user
// from there the data can be put in the respectable folder
$netid = $_SERVER['cn'];

// Take the data given in the post ajax call and decode it in a json format
// There are 6 types of data given to us since there is only one text box
// {user,type,comData,isreply,startDex,endDex}
// The only data saved in a comment are the user, type and comData parts
$data = json_decode($_POST['data']);

// The id and the user directory of the one being replied to
$baseUserdir = $data -> mainUser;
$baseComID = $data -> comID;

$litName = $data -> textChosen;
$userFolder = $data -> userFolder;
$textChoice = "users/$userFolder/works_data/$litName/$litName";

$userdir = $textChoice."_data/$baseUserdir/";
file_put_contents("phpdebug/debug.txt",
"$userdir");

// Puts information into the comment's file
$repData = $data -> repData;
$replyTimeStamp = $data -> timeStamp;
$firstname = $data -> firstname;
$lastname = $data -> lastname;
$netID = $data -> netID;

// Set some information to specific variables
$sendData -> commentData = $repData;
$sendData -> timeStamp = $replyTimeStamp;
$sendData -> firstname = $firstname;
$sendData -> lastname = $lastname;
$sendData -> netid = $netID;

//print("$userdir/$baseComID/$baseComID"."_replies"."/$replyTimeStamp"."_reply");
file_put_contents("$userdir/$baseComID/$baseComID"."_replies"."/$replyTimeStamp"."_reply",json_encode($sendData));

// The folder for comments is "highlight_$netid_$comment#"
// The comment text is in the format "highlight_$netid_$comment#_comment"
// The replies to this is in the format "highlight_$netid_#comment#_replies"
// With the file name of "highlight_$netid_#comment#_reply_$replyNum"

?>
