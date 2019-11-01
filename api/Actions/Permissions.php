<?php

class Permissions
{
    public function __construct($path)
    {
        $this->path = $path;
    }

    /**
     * Get the permissions list of a specified $pathOfWork
     */
    public function getPermissionsList($pathOfWork)
    {
        $filePath = $pathOfWork . "/permissions.json";
        if (!is_dir($pathOfWork)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "that work does not exist",
            ));
        }
        if (!file_exists($filePath)) {
            // return an empty permissions... b/c no permission file exists...
            return json_encode(array(
                "status"  => "ok",
                "message" => "no permissions exist",
                "data"    => (new DefaultPermissions),
            ));
        }

        return json_encode(array(
            "status"  => "ok",
            "message" => "work permissions",
            "data"    => json_decode(file_get_contents($filePath)),
        ));
    }

    /**
     * Add a user's eppn to a specified works'...
     */
    public function addPermission($pathOfWork, $eppn)
    {
        $filePath = $pathOfWork . "/permissions.json";
        if (!file_exists($filePath)) {
            // the permissions file doesn't exist for the specified work... need to create it.
            $permissionTemplate               = new DefaultPermissions;
            $permissionTemplate->{'admins'}[] = $eppn;

            file_put_contents($filePath, json_encode($permissionTemplate));

            return json_encode(array(
                "status"  => "ok",
                "message" => "created new permissions file with user",
            ));
        } else {
            // the permissions file already exists for the work... add the eppn to it...
            $permissionsData = json_decode($this->__getRawPermissionsList($pathOfWork));
            if (!in_array($eppn, $permissionsData->{'admins'})) {
                // add the new eppn to the file
                $permissionsData->{'admins'}[] = $eppn;
                file_put_contents($filePath, json_encode($permissionsData));
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "appended user to existing permissions file",
                ));
            } else {
                // eppn was already in the file...
                return json_encode(array(
                    "status"  => "error",
                    "message" => "user already exists",
                ));
            }
        }
    }

    /**
     * Remove a user from the permissions file of a work
     */
    public function removePermission($pathOfWork, $eppn)
    {
        $filePath = $pathOfWork . "/permissions.json";
        if (!file_exists($filePath)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "work does not have any additional permissions",
            ));
        } else {
            $permissionsData = json_decode($this->__getRawPermissionsList($pathOfWork));
            if (!in_array($eppn, $permissionsData->{'admins'})) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "user not found in permission list",
                ));
            } else {
                $keyToRemove = array_search($eppn, $permissionsData->{'admins'});
                array_splice($permissionsData->{'admins'}, $keyToRemove, 1);
                file_put_contents($filePath, json_encode($permissionsData));
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "removed user from permission list",
                ));
            }
        }
    }

    /**
     * Set a work to 'private' or 'public'
     * Initially checks whether the current user is allowed to do so
     *  -> needs to get the works' `permissions.json` page and see if $eppn is in it
     */
    public function setPermissionsPrivacy($creator, $work, $currentUser, $privacy)
    {
        $pathOfWork = $this->path . "$creator/works/$work";

        /**
         * if $privacy isn't either 'public' or 'private' return error
         */
        if (!in_array($privacy, array(true, false))) {
            return json_encode(array(
                "status"  => "error",
                "message" => "invalid privacy type",
            ));
        }

        /**
         * if the current user isn't on the permissions list return error
         */
        $hasPermissions = $this->userOnPermissionsList($pathOfWork, $currentUser);
        if (!$hasPermissions) {
            return json_encode(array(
                "status"  => "error",
                "message" => "invalid permissions to set work privacy",
            ));
        }

        $permissionsData         = json_decode($this->__getRawPermissionsList($pathOfWork));
        $permissionsData->public = $privacy;
        $filePath                = $pathOfWork . "/permissions.json";
        file_put_contents($filePath, json_encode($permissionsData));

        if ($privacy == true) {
            return json_encode(array(
                "status"  => "ok",
                "message" => "work set to public",
                "other"   => "privacy is " . json_encode($privacy),
            ));
        } else {
            return json_encode(array(
                "status"  => "ok",
                "message" => "work set to private",
                "other"   => "privacy is " . json_encode($privacy),
            ));
        }
    }

    /**
     * Change whether a works' comments need approval or not
     */
    public function setWorkRequiresApproval($creator, $work, $currentUser, $approval)
    {
        $pathOfWork = $this->path . "$creator/works/$work";
        if (!in_array($approval, array(true, false))) {
            return json_encode(array(
                "status"  => "error",
                "message" => "invalid approval type",
            ));
        }

        $hasPermissions = $this->userOnPermissionsList($pathOfWork, $currentUser);
        if (!$hasPermissions) {
            return json_encode(array(
                "status"  => "error",
                "message" => "invalid permissions to change works' comments approval",
            ));
        }

        $permissionsData                            = json_decode($this->__getRawPermissionsList($pathOfWork));
        $permissionsData->comments_require_approval = $approval;
        $filePath                                   = $pathOfWork . "/permissions.json";
        file_put_contents($filePath, json_encode($permissionsData));

        return json_encode(array(
            "status"  => "ok",
            "message" => "successfully changed work approval status to " . json_encode($approval),
        ));
    }

    /**
     * Get the permissions list of a specified $pathOfWork...
     * No padding/extra json garbage for user friendliness...
     * purely return data
     */
    private function __getRawPermissionsList($pathOfWork)
    {
        // $pathOfWork = ../../users/ikleiman@stonybrook.edu/works_data/Something
        $filePath = $pathOfWork . "/permissions.json";
        if (!is_dir($pathOfWork)) {
            return 0;
        }

        if (!file_exists($filePath)) {
            return json_encode(new DefaultPermissions);
        }

        return file_get_contents($filePath);
    }

    /**
     * permissions.php contains list of people who's comments are auto approved and they also can maintain comment approval/visibility
     */
    public function userOnPermissionsList($pathOfWork, $eppn)
    {
        try {
            $eppnEditList = json_decode($this->__getRawPermissionsList($pathOfWork))->admins;
        } catch (Exception $e) {
            return false;
        }

        if (in_array($eppn, $eppnEditList)) {
            return true;
        }

        return false;
    }

    /**
     * Is the work public?
     */
    public function isWorkPublic($pathOfWork)
    {
        try {
            $workIsPublic = json_decode($this->__getRawPermissionsList($pathOfWork))->public;
        } catch (Exception $e) {
            return false; // invalid path
        }

        if ($workIsPublic) {
            return true;
        }

        return false;
    }

    /**
     * Does the work want comments to be approved?
     */
    public function commentsNeedsApproval($pathOfWork)
    {
        try {
            $needApproval = json_decode($this->__getRawPermissionsList($pathOfWork))->comments_require_approval;
        } catch (Exception $e) {
            return false; // invalid path
        }

        if ($needApproval) {
            return true;
        }

        return false;
    }

    /**
     * Can comment without requiring approval
     *
     * NOTE: This logic may need to be checked - Ilan 9/3/19
     */
    public function canCommentWithoutApproval($creator, $work, $commenterEppn)
    {
        $workFullPath = $this->path . $creator . "/works/" . $work;
        if ($this->isWorkPublic($workFullPath)) {
            if ($this->commentsNeedsApproval($workFullPath)) {
                if ($this->userOnPermissionsList($workFullPath, $commenterEppn)) {
                    return json_encode(array(
                        "status" => "ok",
                        "data"   => "false",
                    ));
                } else {
                    return json_encode(array(
                        "status" => "error",
                        "data"   => "true",
                    ));
                }
            } else {
                return json_encode(array(
                    "status" => "ok",
                    "data"   => "false",
                ));
            }
        } else {
            if ($this->userOnPermissionsList($workFullPath, $commenterEppn)) {
                // current user is on the permission list, so even if comments required approval - they'd be able to comment without requiring it...
                // Hence, we don't need to even check if comments require approval here.
                return json_encode(array(
                    "status" => "ok",
                    "data"   => "false",
                ));
            } else {
                return json_encode(array(
                    "status" => "error",
                    "data"   => "true",
                ));
            }
        }
    }

    /**
     * Can the current user view the specified work
     */
    public function canUserViewWork($creator, $work, $currentUser)
    {
        $workFullPath = $this->path . $creator . "/works/" . $work;
        if ($this->isWorkPublic($workFullPath)) {
            return json_encode(array(
                "status" => "ok",
                "data"   => "true",
            ));
        } else {
            if ($this->userOnPermissionsList($workFullPath, $currentUser)) {
                return json_encode(array(
                    "status" => "ok",
                    "data"   => "true",
                ));
            } else {
                return json_encode(array(
                    "status" => "error",
                    "data"   => "false",
                ));
            }
        }
    }
}

class DefaultPermissions
{
    public function __construct()
    {
        $this->admins                    = array();
        $this->public                    = true;
        $this->comments_require_approval = false;
        $this->creator_first_name        = "";
        $this->creator_last_name         = "";
    }
}
