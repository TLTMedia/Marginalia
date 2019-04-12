<?php

class CreateWork
{
    public function __construct()
    {
        /**
         * Empty directories we want to create in the $work directory
         */
        $this->directories = array(
            "data/threads"
        );
    }

    /**
     * Initialization function
     */
    public function init($creator, $work, $privacy, $tmpFilePath)
    {
        /**
         * Create the user directory if it doesn't exist
         */
        if (!file_exists(__PATH__ . $creator)) {
            $this->recurse_copy(__SKELETON_USER__, __PATH__ . $creator);
        }

        $pathOfWork = __PATH__ . "" . $creator . "/works/" . $work;

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
        $execString = "/home1/tltsecure/.local/bin/mammoth $tmpFilePath $destinationPath";
        system($execString);
        //unlink($tmpFilePath);

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
    }

    /**
     * Recursively copy a directory and its contents to the destination
     * https://stackoverflow.com/a/2050909/2751668
     */
    private function recurse_copy($src, $dst) {
        $dir = opendir($src);
        @mkdir($dst);
        while(false !== ( $file = readdir($dir)) ) {
            if (( $file != '.' ) && ( $file != '..' )) {
                if ( is_dir($src . '/' . $file) ) {
                    $this->recurse_copy($src . '/' . $file,$dst . '/' . $file);
                }
                else {
                    copy($src . '/' . $file,$dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
}
