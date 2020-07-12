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
    public function __construct($path, $coursesPath, $skeletonUser)
    {
        /**
         * Empty directories we want to create in the $work directory
         */
        $this->directories = array(
            "data/threads",
        );
        $this->path         = $path;
        $this->coursesPath  = $coursesPath;
        $this->skeletonUser = $skeletonUser;
    }

    /**
     * General purpose initialization method that calls the private init functions.
     */
    public function init($type, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath, $mammothStyle)
    {
        /**
         * These are being read in as strings when sent over formData.
         * & we need to flip them b/c of frontend-backend jargon differences.
         * (public vs private vs privacy...)
         */
        if ($privacy == "true") {
            $privacy = false;
        } else {
            $privacy = true;
        }

        /**
         * Spaces in the work name break stuff.
         */
        $work = str_replace(" ", "_", $work);

        /**
         * Create the user directory if it doesn't exist
         */
        if (!file_exists($this->path . $creator)) {
            $this->__recurse_copy($this->skeletonUser, $this->path . $creator);
        }

        $pathOfWork = $this->path . "" . $creator . "/" . "works" . "/" . $work;

        if (file_exists($pathOfWork)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "you have a document with that name already. Try using a different name.",
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
                    "message" => "unable to create directory: " . $directory,
                ));
            }
        }

        if ($type == "PDF") {
            return $this->__initPdf($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath);
        } elseif ($type == "DOCX") {
            return $this->__initDocx($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath, $mammothStyle);
        } elseif ($type == "HTML") {
            return $this->__initHtml($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath);
        } else {
            return null;
        }
    }

    /**
     * HTML initialization function
     */
    private function __initHtml($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath)
    {
        /**
         * Make a copy of the original uploaded file
         */
        copy($tmpFilePath, $pathOfWork . "/original.html");

        /**
         * Destination path of the file
         */
        $destinationPath = $pathOfWork . "/index.html";

        /**
         * Typically would have conversion script here, but since it's HTML already, we don't need to convert anything.
         * All I need to do is remove any <script> tags and <style> tags
         */
        if (($html = file_get_contents($tmpFilePath)) == false) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to get contents of uploaded file from temp location",
            ));
        }

        $dom = new DOMDocument();
        $dom->loadHTML($html);
        $scriptTag = $dom->getElementsByTagName('script');
        $styleTag  = $dom->getElementsByTagName('style');
        $linkTag   = $dom->getElementsByTagName('link');
        $metaTag   = $dom->getElementsByTagName('meta');
        $remove    = array();

        /**
         * Build list of script tags to remove
         */
        foreach ($scriptTag as $item) {
            $remove[] = $item;
        }

        /**
         * Build list of style tags to remove
         */
        foreach ($styleTag as $item) {
            $remove[] = $item;
        }

        /**
         * Build list of link tags to remove
         */
        foreach ($linkTag as $item) {
            $remove[] = $item;
        }

        /**
         * Build list of meta tags to remove
         */
        foreach ($metaTag as $item) {
            $remove[] = $item;
        }

        /**
         * Remove the compiled list of elements from the DOM
         */
        foreach ($remove as $item) {
            $item->parentNode->removeChild($item);
        }

        $html = $dom->saveHTML();

        /**
         * Save the raw html to it's new destination location
         */
        if (file_put_contents($destinationPath, $html) == false) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to save contents of cleansed file to destination location",
            ));
        }

        /**
         * Shouldn't be necessary, but on this system it seems like it is...
         */
        unlink($tmpFilePath);

        /**
         * Creating the default permissions.json file
         */
        require 'Permissions.php';
        $permissions                     = new DefaultPermissions();
        $permissions->public             = $privacy;
        $permissions->admins[]           = $creator;
        $permissions->creator_first_name = $firstName;
        $permissions->creator_last_name  = $lastName;

        if (file_put_contents($pathOfWork . "/permissions.json", json_encode($permissions)) == false) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to save/create permissions.json file for newly created work",
            ));
        }

        /**
         * Delete the existing symlink if it exists
         */
        if (is_link($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            if (!unlink($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to remove old symlink",
                ));
            }
        }

        /**
         * Create a symlink in the correct course directory
         */
        if (!symlink($pathOfWork, $this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to place the directory in the specified course",
            ));
        }

        return json_encode(array(
            "status"  => "ok",
            "message" => "successfully created work: " . $work,
            "raw"     => "tmp location: " . $tmpFilePath,
        ));
    }

    /**
     * PDF initialization function
     */
    private function __initPdf($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath)
    {
        /**
         * Copy the uploaded file
         */
        copy($tmpFilePath, $pathOfWork . "/original.pdf");

        /**
         * Creating the index.html file with Mammoth
         * NOTE: I'm specifying the python to execute mammoth with for a reason.
         * See: https://github.com/SBUtltmedia/Marginalia/issues/51
         */
        $destinationPath     = "\"" . $pathOfWork . "/index.html" . "\"";
        $realDestinationPath = "\"" . $pathOfWork . "/indexs.html" . "\"";
        $errorOutPath        = $pathOfWork . "/poppler.error.txt";

        $execString = "/usr/bin/pdftohtml -nodrm $tmpFilePath $destinationPath &> $errorOutPath";
        // echo $execString;
        system($execString);

        /**
         * Poppler specific - move the actual file with contents to the destination path
         */
        $destinationPath     = str_replace("\"", "", $destinationPath);
        $realDestinationPath = str_replace("\"", "", $realDestinationPath);

        try {
            $result = file_get_contents($errorOutPath);
        } catch (Exception $e) {
            $result = "";
        }

        try {
            copy($realDestinationPath, $destinationPath);
        } catch (Exception $e) {
            system("rm -rf " . escapeshellarg($pathOfWork));

            return json_encode(array(
                "status"  => "error",
                "message" => $result,
            ));
        }

        // Replace the links
        $newContents = str_replace('<IMG src="../../', '<IMG src="', file_get_contents($destinationPath));
        file_put_contents($destinationPath, $newContents);

        /**
         * Shouldn't be necessary, but on this system it kinda is...
         */
        unlink($tmpFilePath);

        // unlink("${tmpFilePath}.out.txt");

        /**
         * Creating the default permissions.json file
         */
        require 'Permissions.php';
        $permissions                     = new DefaultPermissions();
        $permissions->public             = $privacy;
        $permissions->admins[]           = $creator;
        $permissions->creator_first_name = $firstName;
        $permissions->creator_last_name  = $lastName;

        file_put_contents($pathOfWork . "/permissions.json", json_encode($permissions));

        /**
         * Delete the existing symlink if it exists
         */
        if (is_link($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            if (!unlink($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to remove old symlink",
                ));
            }
        }

        /**
         * Create a symlink in the correct course directory
         */
        if (!symlink($pathOfWork, $this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to place the directory in the specified course",
            ));
        }

        return json_encode(array(
            "status"  => "ok",
            "message" => "successfully created work: " . $work,
            "raw"     => "tmp location: " . $tmpFilePath,
        ));

        /**
         * TODO:
         * NOTE: not reached on purpose...
         * So this would be nice, but mammoth returns warnings that aren't breaking...
         * and same with pdf2html returns warnings that aren't breaking either... So technically this is useless but would be nice.
         */
        if ($result != "") {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to create work: " . $work,
                "raw"     => $result,
            ));
        }
    }

    /**
     * DOCX initialization function
     */
    private function __initDocx($pathOfWork, $creator, $work, $privacy, $course, $firstName, $lastName, $tmpFilePath, $mammothStyle)
    {
        /**
         * Copy the uploaded file
         */
        copy($tmpFilePath, $pathOfWork . "/original.docx");

        /**
         * Creating the index.html file with Mammoth
         * NOTE: I'm specifying the python to execute mammoth with for a reason.
         * See: https://github.com/SBUtltmedia/Marginalia/issues/51
         */
        $destinationPath = "\"" . $pathOfWork . "/index.html" . "\"";
        $errorOutPath    = $pathOfWork . "/mammoth.error.txt";

        $execString = "/home1/tltsecure/.pyenv/versions/anaconda3-5.3.1/bin/python3 /home1/tltsecure/.pyenv/versions/anaconda3-5.3.1/bin/mammoth $tmpFilePath $destinationPath --style-map=$mammothStyle &> $errorOutPath";
        // echo $execString;
        system($execString);

        /**
         * Shouldn't be necessary, but on this system it kinda is...
         */
        unlink($tmpFilePath);

        try {
            $result = file_get_contents($errorOutPath);
        } catch (Exception $e) {
            $result = "";
        }

        /**
         * Creating the default permissions.json file
         */
        require 'Permissions.php';
        $permissions                     = new DefaultPermissions();
        $permissions->public             = $privacy;
        $permissions->admins[]           = $creator;
        $permissions->creator_first_name = $firstName;
        $permissions->creator_last_name  = $lastName;

        file_put_contents($pathOfWork . "/permissions.json", json_encode($permissions));

        /**
         * Delete the existing symlink if it exists
         */
        if (is_link($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            if (!unlink($this->coursesPath . $course . "/" . $creator . "###" . $work)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to remove old symlink",
                ));
            }
        }

        /**
         * Create a symlink in the correct course directory
         */
        if (!symlink($pathOfWork, $this->coursesPath . $course . "/" . $creator . "###" . $work)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to place the directory in the specified course",
            ));
        }

        return json_encode(array(
            "status"  => "ok",
            "message" => "successfully created work: " . $work,
            "raw"     => "tmp location: " . $tmpFilePath,
        ));

        /**
         * TODO:
         * NOTE: not reached on purpose...
         * So this would be nice, but mammoth returns warnings that aren't breaking...
         * and same with pdf2html returns warnings that aren't breaking either... So technically this is useless but would be nice.
         */
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
                    $this->__recurse_copy($src . '/' . $file, $dst . '/' . $file);
                } else {
                    copy($src . '/' . $file, $dst . '/' . $file);
                }
            }
        }

        closedir($dir);
    }
}
