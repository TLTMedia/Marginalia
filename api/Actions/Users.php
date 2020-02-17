<?php

class Users
{
    public function __construct($logger, $path)
    {
        $this->logger = $logger;
        $this->path   = $path;
    }

    /**
     * Returns a list of all the work creators
     */
    public function getCreators()
    {
        $userFolder = glob($this->path . "*");
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
     * Returns list (obj) of all the work creators of a specific course
     */
    public function getCreatorsOfCourse($coursesPath, $course, $eppn)
    {
        /**
         * Check if the course is valid
         */
        require 'Courses.php';
        $courses    = new Courses($this->logger, $coursesPath, $eppn);
        $allCourses = $courses->getCourses();
        if (!in_array($course, $allCourses)) {
            return json_encode(array(
                "status" => "error",
                "data"   => "course does not exist",
            ));
        }

        /**
         * Go into the specified course and get all dirs
         */
        $userFolder     = glob($coursesPath . $course . "/*");
        $allNetIDs      = array();
        $uniqueUserData = array();

        foreach ($userFolder as $userid) {
            $netid = substr($userid, strrpos($userid, '/') + 1);
            $netid = substr($netid, 0, strpos($netid, "#"));
            if (!in_array($netid, $allNetIDs)) {
                array_push($allNetIDs, $netid);

                /**
                 * Get the real path from the symlink in courses
                 */
                $realLink = readlink($coursesPath . $course . "/" . $userid);
                if (!$realLink) {
                    return json_encode(array(
                        "status" => "error",
                        "data"   => "unable to find work in courses directory (symlink broken)",
                    ));
                }

                /**
                 * Get first and last name of the author
                 */
                $permissionData = file_get_contents($realLink . "/permissions.json");
                if (!$permissionData) {
                    return json_encode(array(
                        "status" => "error",
                        "data"   => "unable to get permissions file from work. does permissions exist for work?",
                    ));
                }

                $permissionData = json_decode($permissionData);
                //var_dump($permissionData);
                $uniqueUserData[] = array(
                    "eppn"      => $netid,
                    "firstName" => $permissionData->creator_first_name,
                    "lastName"  => $permissionData->creator_last_name,
                );
            }
        }

        return json_encode(array(
            "status" => "ok",
            "data"   => $uniqueUserData,
        ));
    }

    /**
     * Get works of a specified creator in a course
     */
    public function getWorksOfCourseAndCreator($creator, $course, $coursesPath, $currentEppn)
    {
        require 'Courses.php';
        $courses     = new Courses($this->logger, $coursesPath, $currentEppn);
        $courseWorks = $courses->getWorksInCourseByCreator($course, $creator);

        $allUserWorks = json_decode($this->getUserWorks($creator, $currentEppn));
        if ($allUserWorks->status == "ok") {
            /**
             * Why bother getting the intersection? B/c getUserWorks() is permissions safe and Courses.php isn't
             */
            $allUserWorksCanViewClean = array();
            foreach ($allUserWorks->data as $viewableWork) {
                $allUserWorksCanViewClean[] = substr($viewableWork, 0, strrpos($viewableWork, '.'));
            }
            return json_encode(array(
                "status" => "ok",
                "data"   => array_intersect($allUserWorksCanViewClean, $courseWorks),
            ));
        } else {
            return json_encode(array(
                "status" => "error",
                "data"   => "unable to get user works, " . $allUserWorks->data,
            ));
        }
    }

    /**
     * Returns info on the currently logged in user
     */
    public function getCurrentUser($firstName, $lastName, $eppn)
    {
        $this->__createUserIfNotExists($eppn, $firstName, $lastName);

        $user            = json_decode("");
        $user->firstname = $firstName;
        $user->lastname  = $lastName;
        $user->eppn      = $eppn;

        return json_encode(array(
            "status" => "ok",
            "data"   => $user,
        ));
    }

    /**
     * Returns list of all the users that match the specified $search string
     * This is similar to getCreators() - but this will return a matching of $search AND the first & last name,
     */
    public function getAllUserMatches($search)
    {
        $search = strtolower($search);

        $allUserInfo   = $this->__getAllUserInfo();
        $specificUsers = array();

        foreach ($allUserInfo as $userInfo) {
            // check if eppn matches
            if (strpos(strtolower($userInfo->eppn), $search) !== false) {
                array_push($specificUsers, $userInfo);
                continue;
            }

            // check if first name matches
            if (strpos(strtolower($userInfo->firstName), $search) !== false) {
                array_push($specificUsers, $userInfo);
                continue;
            }

            // check if last name matches
            if (strpos(strtolower($userInfo->lastName), $search) !== false) {
                array_push($specificUsers, $userInfo);
            }
        }

        return json_encode(array(
            "status" => "ok",
            "data"   => $specificUsers,
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

    private function __createUserIfNotExists($eppn, $firstName, $lastName)
    {
        /**
         * Create the user dir if not exists directory
         */
        if (!is_dir($this->path . $eppn)) {
            mkdir($this->path . $eppn, 0777);
        }

        /**
         * Create the user info file if not exists
         */
        $userInfo     = new UserInfo($eppn, $firstName, $lastName);
        $userInfoJson = json_encode($userInfo);

        if (!is_file($this->path . $eppn . "/info.json")) {
            file_put_contents($this->path . $eppn . "/info.json", $userInfoJson);
        }
    }

    /**
     * Returns an array with all the users infos (eppn, first, last)
     */
    private function __getAllUserInfo()
    {
        $userFolders = glob($this->path . "*");
        $allUserInfo = array();

        foreach ($userFolders as $userFolderPath) {
            if (file_exists($userFolderPath . "/info.json")) {
                $userInfo = json_decode(file_get_contents($userFolderPath . "/info.json"));
                array_push($allUserInfo, $userInfo);
            }
        }

        return $allUserInfo;
    }
}

class UserInfo
{
    public function __construct($eppn, $firstName, $lastName)
    {
        $this->eppn      = $eppn;
        $this->firstName = $firstName;
        $this->lastName  = $lastName;
    }
}
