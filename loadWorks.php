<?
require("isAdmin.php");

$worksArray = load_works();
print json_encode($worksArray);

function load_works()
{
  $allWorks = array();
  $works = glob("works/*");
  foreach($works as $lit)
  {
    $work = split("/",$lit);
    $work = $work[1];
    $work = substr($work, 0, -5);
    array_push ($allWorks,$work);
  }
  return $allWorks;
}
?>
