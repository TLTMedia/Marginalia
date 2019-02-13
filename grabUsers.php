<?
header('Content-Type: application/json');
$usersFolder = "users/*";
$userFolder = glob($usersFolder);

$allNetIDs = array();;

foreach($userFolder as $userid)
{
  $netid = split("/",$userid);
  array_push($allNetIDs,$netid[1]);
}

print json_encode($allNetIDs);
?>
