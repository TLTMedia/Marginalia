<?
$data = json_decode($_GET['data']);

$userFolder = $data -> userFolder;
$work = $data -> work;

$sourceFile = "users/$userFolder/works/$work.txt";

$text = file_get_contents($sourceFile);

print $text;

return $text;
?>
