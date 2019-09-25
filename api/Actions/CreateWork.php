<?php

class CreateWork
{
    public function __construct($path, $skeletonUser)
    {
        /**
         * Empty directories we want to create in the $work directory
         */
        $this->directories = array(
            "data/threads"
        );
        $this->path = $path;
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
                "status" => "error",
                "message" => "work already exists"
            ));
        } else {
            if (!mkdir($pathOfWork, 0777, TRUE)) {
                return json_encode(array(
                    "status" => "error",
                    "message" => "unabled to create work"
                ));
            }
        }

        /**
         * Creating the default directories for the new work
         */
        foreach ($this->directories as $directory) {
            if (!mkdir($pathOfWork . "/" . $directory, 0777, TRUE)) {
                return json_encode(array(
                    "status" => "error",
                    "message" => "unabled to create directory: " . $directory
                ));
            }
        }

        /**
         * Creating the index.html file with Mammoth
         */
        $destinationPath = $pathOfWork . "/index.html";
        $execString = "/home1/tltsecure/.local/bin/mammoth $tmpFilePath $destinationPath 2>${tmpFilePath}.out.txt";
        system($execString);
        unlink($tmpFilePath);

        $result = file_get_contents("${tmpFilePath}.out.txt");
        unlink("${tmpFilePath}.out.txt");

        /**
         * Creating the default permissions.json file
         */
        require 'Permissions.php';
        $permissions = new DefaultPermissions;
        $permissions->privacy = $privacy;
        $permissions->admins[] = $creator;
        file_put_contents($pathOfWork . "/permissions.json", json_encode($permissions));

        return json_encode(array(
            "status" => "ok",
            "message" => "successfully created work: " . $work
        ));

        if ($result != "") {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to create work: " . $work,
                "raw" => $result
            ));
        }
    }

    /**
     * Recursively copy a directory and its contents to the destination
     * https://stackoverflow.com/a/2050909/2751668
     */
    private function recurse_copy($src, $dst) {
        $dir = opendir($src);
        @mkdir($dst);
        while(FALSE !== ($file = readdir($dir))) {
            if ($file != '.' && $file != '..') {
                if (is_dir($src . '/' . $file)) {
                    $this->recurse_copy($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file,$dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
}
