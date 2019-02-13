<?
$netid = $_SERVER['cn'];
$file = $_GET['file'];

$filePath = "users/$netid/works_data/$file/moderatedPage";

if(file_exists($filePath))
{
  $privateers = file_get_contents($filePath);

  $names = explode("\n",$privateers);

  print json_encode($names);
}
else {
  print json_encode(false);
}
?>
