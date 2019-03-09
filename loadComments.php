<?
$user=json_decode("{}");
$user->firstname=$_SERVER['nickname'];
$user->lastname=$_SERVER['sn'];
$user->netid=$_SERVER['cn'];
// $data= json_decode(file_get_contents("dummyData.json"));
$data->user =$user;
print json_encode($data);
