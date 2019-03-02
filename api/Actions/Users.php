<?php

class Users
{
    /**
     * Returns a list of the users
     */
    public function getUsers()
    {
        $userFolder = glob("../../users/*");
        $allNetIDs = array();

        foreach($userFolder as $userid) {
            $netid = substr($userid, strrpos($userid, '/') + 1);;
            array_push($allNetIDs, $netid);
        }

        return json_encode($allNetIDs);
    }

    /**
     * Returns info on the currently logged in user
     */
    public function getCurrentUser()
    {
        $user = json_decode("{}");
        $user->firstname = $_SERVER['nickname'];
        $user->lastname = $_SERVER['sn'];
        $user->netid = $_SERVER['eppn'];

        return json_encode($user);
    }
}
