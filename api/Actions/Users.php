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

    /**
     * Returns a list of the users works
     */
    public function getUserWorks()
    {
        // holds an array of all the works in the user's(eppn) directory
        $allWorks = array();

        foreach(glob("../../users/" . $_SERVER['eppn'] . "/works_data/*") as $work) {
            $workName = substr($work, strrpos($work, '/') + 1);
            array_push($allWorks, $workName . ".html");
        }

        return json_encode($allWorks);
    }
}
