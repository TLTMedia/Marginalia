<?php

class Users
{
    public function __construct($path)
    {
        $this->path = $path;
    }

    /**
     * Create User
     */
    

    /**
     * Returns a list of all the work creators
     */
    public function getCreators()
    {
        $userFolder = glob("../../users/*");
        $allNetIDs  = array();

        foreach ($userFolder as $userid) {
            $netid = substr($userid, strrpos($userid, '/') + 1);
            array_push($allNetIDs, $netid);
        }

        return json_encode(array(
            "status" => "ok",
            "data"   => $allNetIDs,
        ));
    }

    /**
     * Returns info on the currently logged in user
     */
    public function getCurrentUser($firstName, $lastName, $eppn)
    {
        $user            = json_decode("{}");
        $user->firstname = $firstName;
        $user->lastname  = $lastName;
        $user->eppn      = $eppn;

        return json_encode(array(
            "status" => "ok",
            "data"   => $user,
        ));
    }

    /**
     * Returns a list of the users works
     */
    public function getUserWorks($eppn, $currentEppn)
    {
        require 'Permissions.php';
        $permissions   = new Permissions($this->path);
        $allWorks      = array();
        $userWorksPath = $this->path . $eppn . "/works/";
        foreach (glob($userWorksPath . "*") as $work) {
            $workName = substr($work, strrpos($work, '/') + 1);
            if (!$permissions->isWorkPublic($work)) {
                if ($permissions->userOnPermissionsList($work, $currentEppn)) {
                    array_push($allWorks, $workName . ".html");
                } else {
                    // work is private but user isn't on the permissions
                    // so don't show the user this work
                }
            } else {
                // work is public
                array_push($allWorks, $workName . ".html");
            }
        }

        return json_encode(array(
            "status" => "ok",
            "data"   => $allWorks,
        ));
    }

    /**
     * Grab user work data...
     */
    public function getUserWork($pathOfWork, $currentEppn)
    {
        $workIndex = $pathOfWork . "/index.html";
        if (!file_exists($workIndex)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "work does not exist",
            ));
        }

        require 'Permissions.php';
        $permissions = new Permissions($this->path);
        if (!$permissions->isWorkPublic($pathOfWork)) {
            if ($permissions->userOnPermissionsList($pathOfWork, $currentEppn)) {
                if ($permissions->commentsNeedsApproval($pathOfWork)) {
                    return json_encode(array(
                        "status"   => "ok",
                        "data"     => file_get_contents($workIndex),
                        "admin"    => true, // must be to reach here,
                         "privacy"  => "private",
                        "approval" => "needApproval",
                    ));
                } else {
                    return json_encode(array(
                        "status"   => "ok",
                        "data"     => file_get_contents($workIndex),
                        "admin"    => true, // must be to reach here,
                         "privacy"  => "private",
                        "approval" => "noApproval",
                    ));
                }
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "invalid permissions to view work",
                ));
            }
        } else {
            if ($permissions->commentsNeedsApproval($pathOfWork)) {
                return json_encode(array(
                    "status"   => "ok",
                    "data"     => file_get_contents($workIndex),
                    "admin"    => $permissions->userOnPermissionsList($pathOfWork, $currentEppn),
                    "privacy"  => "public",
                    "approval" => "needApproval",
                ));
            } else {
                return json_encode(array(
                    "status"   => "ok",
                    "data"     => file_get_contents($workIndex),
                    "admin"    => $permissions->userOnPermissionsList($pathOfWork, $currentEppn),
                    "privacy"  => "public",
                    "approval" => "noApproval",
                ));
            }
        }
    }

}
