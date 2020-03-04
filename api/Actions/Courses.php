<?php

class Courses
{
    public function __construct($logger, $path, $currentUser)
    {
        $this->logger      = $logger;
        $this->path        = $path;
        $this->currentUser = $currentUser;
    }

    public function getCourses()
    {
        $courses       = glob($this->path . '*', GLOB_ONLYDIR);
        $prettyCourses = array();

        foreach ($courses as $course) {
            $prettyCourses[] = str_replace($this->path, "", $course);
        }

        return $prettyCourses;
    }

    public function getWorksInCourseByCreator($course, $creator)
    {
        $filteredWorks = array();
        $rawWorks      = $this->getRawWorksInCourse($course);

        foreach ($rawWorks as $rawWork) {
            $creatorWork = explode("###", $rawWork);

            if ($creatorWork[0] == $creator) {
                $filteredWorks[] = $creatorWork[1];
            }
        }

        return $filteredWorks;
    }

    public function getRawWorksInCourse($course)
    {
        $works       = glob($this->path . "/" . $course . "/*", GLOB_ONLYDIR);
        $prettyWorks = array();

        foreach ($works as $work) {
            $prettyWorks[] = str_replace($this->path . "/" . $course . "/", "", $work);
        }

        return $prettyWorks;
    }

    public function userIsCoursesAdmin($eppn)
    {
        require 'Permissions.php';
        $permissions = new Permissions($this->path);

        $role = "user";
        if ($permissions->userOnPermissionsList($this->path, $eppn)) {
            $role = "admin";
        }

        return array(
            "status" => "ok",
            "data"   => $role,
        );
    }

    public function addCourse($courseName)
    {
        require 'Permissions.php';
        $permissions = new Permissions($this->path);

        $hasPermissions = $permissions->userOnPermissionsList($this->path, $this->currentUser);
        if (!$hasPermissions) {
            return array(
                "status" => "error",
                "data"   => "invalid permissions to add new course",
            );
        }

        if (!mkdir($this->path . "/" . $courseName, 0700)) {
            $this->logger->error("unable to create course directory mkdir() operation.");

            return array(
                "status" => "error",
                "data"   => "unable to create course directory for unknown reason",
            );
        }

        return array(
            "status" => "ok",
            "data"   => "successfully created course directory " . $courseName,
        );
    }

    /**
     * Add a course admin, checks to see if the current user is a valid admin
     */
    public function addCourseAdmin($selfEppn, $toAddEppn)
    {
        /**
         * Check if $selfEppn is even on the course admin list themselves
         */
        require 'Permissions.php';
        $permissions = new Permissions($this->path);

        if ($permissions->userOnPermissionsList($this->path, $selfEppn)) {
            if ($permissions->userOnPermissionsList($this->path, $toAddEppn)) {
                return array(
                    "status" => "ok",
                    "data"   => "User was already an admin",
                );
            } else {
                if ($permissions->addUserToCoursesPermissions($toAddEppn)) {
                    return array(
                        "status" => "ok",
                        "data"   => "Successfully added user as admin",
                    );
                } else {
                    return array(
                        "status" => "error",
                        "data"   => "Unable to add user to permissions file",
                    );
                }
            }
        } else {
            return array(
                "status" => "error",
                "data"   => "Current user is not admin; or other error",
            );
        }
    }

    /**
     * Removes a course admin, check to see if the current user is a valid admin
     */
    public function removeCourseAdmin($selfEppn, $toAddEppn)
    {
        /**
         * Check if $selfEppn is even on the course admin list themselves
         */
        require 'Permissions.php';
        $permissions = new Permissions($this->path);

        if ($permissions->userOnPermissionsList($this->path, $selfEppn)) {
            if (!$permissions->userOnPermissionsList($this->path, $toAddEppn)) {
                return array(
                    "status" => "ok",
                    "data"   => "That user wasn't on the admin list",
                );
            } else {
                if ($permissions->removeUserFromCoursesPermissions($toAddEppn)) {
                    return array(
                        "status" => "ok",
                        "data"   => "Successfully removed user as admin",
                    );
                } else {
                    return array(
                        "status" => "error",
                        "data"   => "Unable to add user to permissions file",
                    );
                }
            }
        } else {
            return array(
                "status" => "error",
                "data"   => "Current user is not admin; or other error",
            );
        }
    }

    /**
     * Gets list of all the courses admins
     * Only a course admin can view this list, so first authenticate.
     */
    public function getAllCoursesAdmins()
    {
        require 'Permissions.php';
        $permissions = new Permissions($this->path);

        $hasPermissions = $permissions->userOnPermissionsList($this->path, $this->currentUser);
        if (!$hasPermissions) {
            return array(
                "status" => "error",
                "data"   => "invalid permissions to view course admins",
            );
        }

        $permissionsFile = json_decode($permissions->getPermissionsList($this->path));
        $adminList       = $permissionsFile->data->admins;

        return array(
            "status" => "ok",
            "data"   => $adminList,
        );
    }
}
