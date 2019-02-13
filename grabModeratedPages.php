<?
$user = $_GET['folder'];
$worksData = "users/$user/works_data/*";
$data = glob($worksData);

$allMods = json_decode("{}");

foreach($data as $info)
{
  $workPath = split("/",$info);
  $workName = $workPath[3];
  $path = "users/$user/works_data/$workName/moderatedPage";
  if(file_exists($path))
  {
    $moderators = file_get_contents($path);
    $modArray = split("\n",$moderators);
    $allMods -> $workName = $modArray;
  }
}
print json_encode($allMods);
?>
