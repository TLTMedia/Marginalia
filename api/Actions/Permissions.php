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
}

class DefaultPermissions
{
    public function __construct()
    {
        $this->admins = array();
    }
}
