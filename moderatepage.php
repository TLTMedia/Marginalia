<?
  $netid = $_SERVER['cn'];
  $data = json_decode($_POST['data']);
  $work = $data -> work;

  // If the type is true, they're trying to save
  // If it's false then they're trying to delete
  $fileAction = $data -> type;

  $dir = "users/$netid/works_data/$work/moderatedPage";
  if($fileAction)
  {
    if(!file_exists($dir))
    {
      file_put_contents($dir,$netid);
    }
  }
  else
  {
    if(file_exists($dir))
    {
      exec("rm -rf $dir");
    }
  }
?>
