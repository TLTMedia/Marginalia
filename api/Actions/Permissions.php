<?php

class Permissions
{
    /**
     * Get the permissions list of a specified $pathOfWork
     */
    public function getPermissionsList($pathOfWork)
    {
        // $pathOfWork = ../../users/ikleiman@stonybrook.edu/works_data/Something
        $filePath = $pathOfWork . "/permissions.json";
        if (!is_dir($pathOfWork)) {
            return json_encode(array(
                "status" => "error",
                "message" => "that work does not exist"
            ));
        }
        if (!file_exists($filePath)) {
            // return an empty permissions... b/c no permission file exists...
            return json_encode(array(
                "status" => "ok",
                "message" => "no permissions exist",
                "data" => (new DefaultPermissions)
            ));
        }

        return json_encode(array(
            "status" => "ok",
            "message" => "work permissions",
            "data" => json_decode(file_get_contents($filePath))
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
            $permissionTemplate = new DefaultPermissions;
            $permissionTemplate->{'admins'}[] = $eppn;

            file_put_contents($filePath, json_encode($permissionTemplate));

            return json_encode(array(
                "status" => "ok",
                "message" => "created new permissions file with user"
            ));
        } else {
            // the permissions file already exists for the work... add the eppn to it...
            $permissionsData = json_decode($this->getRawPermissionsList($pathOfWork));
            if (!in_array($eppn, $permissionsData->{'admins'})) {
                // add the new eppn to the file
                $permissionsData->{'admins'}[] = $eppn;
                file_put_contents($filePath, json_encode($permissionsData));
                return json_encode(array(
                    "status" => "ok",
                    "message" => "appended user to existing permissions file"
                ));
            } else {
                // eppn was already in the file...
                return json_encode(array(
                    "status" => "error",
                    "message" => "user already exists"
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
                "status" => "error",
                "message" => "work does not have any additional permissions"
            ));
        } else {
            $permissionsData = json_decode($this->getRawPermissionsList($pathOfWork));
            if (!in_array($eppn, $permissionsData->{'admins'})) {
                return json_encode(array(
                    "status" => "error",
                    "message" => "user not found in permission list"
                ));
            } else {
                $keyToRemove = array_search($eppn, $permissionsData->{'admins'});
                array_splice($permissionsData->{'admins'}, $keyToRemove, 1);
                file_put_contents($filePath, json_encode($permissionsData));
                return json_encode(array(
                    "status" => "ok",
                    "message" => "removed user from permission list"
                ));
            }
        }
    }

    /**
     * Set a work to 'private' or 'public'
     * Initially checks whether the current user is allowed to do so
     *  -> needs to get the works' `permissions.json` page and see if $eppn is in it
     */
    public function setPermissionsPrivacy($creator, $work, $currentUser, $public)
    {
        $pathOfWork = __PATH__ . "$creator/works/$work";

        /**
         * if $privacy isn't either 'public' or 'private' return error
         */
        if (!in_array($public, array('true', 'false'))) {
            return json_encode(array(
                "status" => "error",
                "message" => "invalid privacy type"
            ));
        }

        /**
         * if the current user isn't on the permissions list return error
         */
        $hasPermissions = $this->userOnPermissionsList($pathOfWork, $currentUser);
        if (!$hasPermissions) {
            return json_encode(array(
                "status" => "error",
                "message" => "invalid permissions to set work privacy"
            ));
        }

        $permissionsData = json_decode($this->getRawPermissionsList($pathOfWork));
        $permissionsData->public = json_decode($public);
        $filePath = $pathOfWork . "/permissions.json";
        file_put_contents($filePath, json_encode($permissionsData));

        return json_encode(array(
            "status" => "ok"
        ));
    }

//TODO might need some edit
    public function setPermissionsCNA($creator, $work, $currentUser, $approval)
    {
        $pathOfWork = __PATH__ . "$creator/works/$work";
        /**
         * if $approval isn't either 'true' or 'false' return error
         */
        if (!in_array($approval, array('true', 'false'))) {
            return json_encode(array(
                "status" => "error",
                "message" => "invalid privacy type"
            ));
        }
        /**
         * if the current user isn't on the permissions list return error
         */
        $hasPermissions = $this->userOnPermissionsList($pathOfWork, $currentUser);
        if (!$hasPermissions) {
            return json_encode(array(
                "status" => "error",
                "message" => "invalid permissions to set work privacy"
            ));
        }

        $permissionsData = json_decode($this->getRawPermissionsList($pathOfWork));
        $permissionsData->comments_require_approval = json_decode($approval);
        $filePath = $pathOfWork . "/permissions.json";
        file_put_contents($filePath, json_encode($permissionsData));

        return json_encode(array(
            "status" => "ok"
        ));
    }

    /**
     * Get the permissions list of a specified $pathOfWork...
     * No padding/extra json garbage for user friendliness...
     * purely return data
     */
    private function getRawPermissionsList($pathOfWork)
    {
        // $pathOfWork = ../../users/ikleiman@stonybrook.edu/works_data/Something
        $filePath = $pathOfWork . "/permissions.json";
        if (!is_dir($pathOfWork)) {
            return 0;
        }

        if (!file_exists($filePath)) {
            return json_encode(new DefaultPermissions);;
        }

        return file_get_contents($filePath);
    }

    /**
     * permissions.php contains list of people who's comments are auto approved and they also can maintain comment approval/visibility
     */
    public function userOnPermissionsList($pathOfWork, $eppn)
    {
        try {
            $eppnEditList = json_decode($this->getRawPermissionsList($pathOfWork))->admins;
        } catch(Exception $e) {
            return FALSE;
        }

        if (in_array($eppn, $eppnEditList)) {
            return TRUE;
        }

        return FALSE;
    }

    /**
     * Is the work public?
     */
    public function isWorkPublic($pathOfWork)
    {
        try {
            $workIsPublic = json_decode($this->getRawPermissionsList($pathOfWork))->public;
        } catch(Exception $e) {
            return FALSE; // invalid path
        }

        if ($workIsPublic) {
            return TRUE;
        }

        return FALSE;
    }

    /**
     * Does the work want comments to be approved?
     */
    public function commentsNeedsApproval($pathOfWork)
    {
        try {
            $needApproval = json_decode($this->getRawPermissionsList($pathOfWork))->comments_require_approval;
        } catch(Exception $e) {
            return FALSE; // invalid path
        }

        if ($needApproval) {
            return TRUE;
        }

        return FALSE;
    }
}

class DefaultPermissions
{
    public function __construct()
    {
        $this->admins = array();
        $this->public = TRUE;
        $this->comments_require_approval = FALSE;
    }
}
