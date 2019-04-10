<?php

class CreateWork
{
    public function __construct($creator, $work, $privacy, $data)
    {
        /**
         * Create the user directory if it doesn't exist
         */
        if (!file_exists(__PATH__ . $creator)) {
            $this->recurse_copy(__SKELETON_USER__, __PATH__ . $creator);
        }

        $this->pathOfWork = __PATH__ . "$creator/works/$work";
        if (file_exists($this->pathOfWork)) {
            return json_encode(array(
                "status" => "error",
                "message" => "work already exists"
            ));
        }

        $this->directories = array(
            "data"
        );

        $this->files = array(
            "index.html",
            "permissions.json"
        );

        /**
         * Creating The Default Directories
         */

        /**
         * Creating the default files
         * @var [type]
         */

        // require 'Permissions.php'
        // $permissions = new Permissions;

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
                    recurse_copy($src . '/' . $file,$dst . '/' . $file);
                }
                else {
                    copy($src . '/' . $file,$dst . '/' . $file);
                }
            }
        }
        closedir($dir);
    }
}
