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
                "status"  => "error",
                "message" => "invalid permissions to add new course",
            );
        }

        if (!mkdir($this->path . "/" . $courseName, 0700)) {
            $this->logger->error("unable to create course directory mkdir() operation.");
            return array(
                "status"  => "error",
                "message" => "unable to create course directory for unknown reason",
            );
        }

        return array(
            "status"  => "ok",
            "message" => "successfully created course directory " . $courseName,
        );
    }
}
