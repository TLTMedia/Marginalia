<?

$localAdmin = $_GET['localAdmin'];

// Used to hold both the normal whitelist and the admin whitelist
$whitelistTotal = array();

$whitelistTotal = load_whitelist("whitelist");
$local = load_whitelist("users/$localAdmin/$localAdmin"."_whitelist");

$whitelistTotal = $whitelistTotal."\n".$local;

print $whitelistTotal;

function load_whitelist($whitelistSource)
{
  $whitelistFile = file_get_contents($whitelistSource);
  return $whitelistFile;
}
?>
