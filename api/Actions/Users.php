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

        return json_encode(array(
            "status" => "ok",
            "data" => $allNetIDs
        ));
    }

    /**
     * Returns info on the currently logged in user
     */
    public function getCurrentUser()
    {
        $user->firstname = $_SERVER['nickname'];
        $user->lastname = $_SERVER['sn'];
        $user->eppn = $_SERVER['eppn'];

        return json_encode(array(
            "status" => "ok",
            "data" => $user
        ));
    }

    /**
     * Returns a list of the users works
     */
    public function getUserWorks($user)
    {
        // TODO: check if the current $_SERVER['eppn'] has access to this $user directory
        // holds an array of all the works in the user's(eppn) directory
        $allWorks = array();

        foreach(glob("../../users/" . $user . "/works/*") as $work) {
            $workName = substr($work, strrpos($work, '/') + 1);
            array_push($allWorks, $workName . ".html");
        }

        return json_encode(array(
            "status" => "ok",
            "data" => $allWorks
        ));
    }

    /**
     * Grab user work data...
     */
    public function getUserWork($pathOfWork)
    {
        if (!file_exists($pathOfWork)) {
            return json_encode(array(
                "status" => "error",
                "message" => "work does not exist"
            ));
        }

        return json_encode(array(
            "status" => "ok",
            "data" => file_get_contents($pathOfWork)
        ));
    }
}
