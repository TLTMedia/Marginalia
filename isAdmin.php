<?
date_default_timezone_set('UTC');
$netid = $_SERVER['cn'];

$isAdmin = in_array($netid,explode("\n",load_whitelist("whitelist")));


// If the request is comming from save.php the local admin(s) will need to be found
// If not then the user's relative adminds are found
if($localAdmin == "")
{
  $isRelativeAdmin = in_array($netid,explode("\n",load_whitelist("users/$netid/$netid"."_whitelist")));
}
else {
  $isRelativeAdmin = in_array($netid,explode("\n",load_whitelist("users/$localAdmin/$localAdmin"."_whitelist")));
}

function load_whitelist($whitelistSource)
{
  $whitelistFile = file_get_contents($whitelistSource);
  return $whitelistFile;
}
?>
