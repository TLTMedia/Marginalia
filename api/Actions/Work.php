<?php

class Work
{
    public function __construct($path, $creator, $work)
    {
        $this->path     = $path;
        $this->creator  = $creator;
        $this->work     = $work;
        $this->workPath = $path . $creator . "/works/" . $work;
        require 'Permissions.php';
        $this->permissions = new Permissions($path);
    }

    public function deleteWork($deleterEppn)
    {
        if ($this->permissions->userOnPermissionsList($this->workPath, $deleterEppn)) {
            if ($this->__deleteDir($this->workPath, false)) {
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "successfully deleted work",
                ));
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to delete specified work",
                ));
            }
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "only users on the permissions list can delete this work",
            ));
        }
    }

    private static function __deleteDir($dirPath, $removeEmptyParent)
    {
        if (!is_dir($dirPath)) {
            return false;
        }

        if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
            $dirPath .= '/';
        }

        $files = glob($dirPath . '{,.}[!.,!..]*', GLOB_MARK | GLOB_BRACE);
        foreach ($files as $file) {
            if (is_dir($file)) {
                self::__deleteDir($file, false);
            } else {
                unlink($file);
            }
        }

        rmdir($dirPath);
        $parent = dirname($dirPath);
        if (count(glob("$parent/*")) === 0 && $removeEmptyParent) {
            rmdir($parent);
        }

        return true;
    }
}

class CreateWork
{
    public function __construct($path, $skeletonUser)
    {
        /**
         * Empty directories we want to create in the $work directory
         */
        $this->directories = array(
            "data/threads",
        );
        $this->path         = $path;
        $this->skeletonUser = $skeletonUser;
    }

    /**
     * Initialization function
     */
    public function init($creator, $work, $privacy, $tmpFilePath)
    {
        /**
         * Create the user directory if it doesn't exist
         */
        if (!file_exists($this->path . $creator)) {
            $this->recurse_copy($this->skeletonUser, $this->path . $creator);
        }

        $pathOfWork = $this->path . "" . $creator . "/works/" . $work;

        if (file_exists($pathOfWork)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "work already exists",
            ));
        } else {
            if (!mkdir($pathOfWork, 0777, true)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unabled to create work",
                ));
            }
        }

        /**
         * Creating the default directories for the new work
         */
        foreach ($this->directories as $directory) {
            if (!mkdir($pathOfWork . "/" . $directory, 0777, true)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unabled to create directory: " . $directory,
                ));
            }
        }

        /**
         * Creating the index.html file with Mammoth
         */
        $destinationPath = $pathOfWork . "/index.html";
        $execString      = "/home1/tltsecure/.local/bin/mammoth $tmpFilePath $destinationPath 2>${tmpFilePath}.out.txt";
        system($execString);
        unlink($tmpFilePath);

        $result = file_get_contents("${tmpFilePath}.out.txt");
        unlink("${tmpFilePath}.out.txt");

        /**
         * Creating the default permissions.json file
         */
        require 'Permissions.php';
        $permissions           = new DefaultPermissions;
        $permissions->privacy  = $privacy;
        $permissions->admins[] = $creator;
        file_put_contents($pathOfWork . "/permissions.json", json_encode($permissions));

        return json_encode(array(
            "status"  => "ok",
            "message" => "successfully created work: " . $work,
        ));

        if ($result != "") {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to create work: " . $work,
                "raw"     => $result,
            ));
        }
    }

    /**
     * Recursively copy a directory and its contents to the destination
     * https://stackoverflow.com/a/2050909/2751668
     */
    private function __recurse_copy($src, $dst)
    {
        $dir = opendir($src);
        @mkdir($dst);
        while (false !== ($file = readdir($dir))) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->recurse_copy($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
}
