<?
$user = $_GET['folder'];

$userWorks = "users/$user/works/*";

$works = glob($userWorks);

$allWorks = array();

foreach($works as $work)
{
  $workPath = split("/",$work);
  $workName = $workPath[3];
  $workName = substr($workName, 0, -4);
  array_push($allWorks,$workName);
}
print json_encode($allWorks);
?>
