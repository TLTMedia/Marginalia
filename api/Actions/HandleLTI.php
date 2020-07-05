<?php

class HandleLTI
{
    /**
     * User Specific Identifiers: $authUniqueId, $authFirstName, $authLastName are for the current user. Not the work creator.
     */
    public function __construct($logger, $usersPath, $authUniqueId, $authFirstName, $authLastName)
    {
        $this->logger           = $logger;
        $this->usersPath        = $usersPath;
        $this->currentEppn      = $authUniqueId;
        $this->currentFirstName = $authFirstName;
        $this->currentLastName  = $authLastName;
    }

    /**
     * Create an LTI Session file in the specified work for the $currentEppn user. Save the posted data.
     */
    public function initiateUserSessionLTI($postData, $getData)
    {
        $workPath    = $this->usersPath . $getData["creator"] . "/" . "works" . "/" . $getData["work"] . "/";
        $workPathLTI = $workPath . "data" . "/" . "lti";

        /**
         * Get the LTI obj for current user
         */
        if (!$this->__getUserCreateIfNeeded($workPathLTI, $postData, 10)) {
            $this->logger->error("unable to get/create user file LTI");

            return false;
        }

        return true;
    }

    /**
     * TODO: Everytime a comment is deleted, remove the point from the LTI store.
     */
    public function deductPoint()
    {
        return false;
    }

    /**
     * Update the user's locally saved LTI file to have +1 comment points.
     * Everytime user creates a new comment, this would be incremented...
     *
     * TODO:
     * 1. DONT add a point, if the comment needs to be approved (and is not approved).
     * 2. Add a point when an unapproved comment becomes approved.
     *
     */
    public function addPoint($creator, $work, $userEppn)
    {
        $workPath    = $this->usersPath . $creator . "/" . "works" . "/" . $work . "/";
        $workPathLTI = $workPath . "data" . "/" . "lti";
        $userFile    = $workPathLTI . "/" . $userEppn . ".json";

        /**
         * Get the LTI obj for specified user
         */
        $userLTI = $this->__getUser($workPathLTI, $userEppn);
        if (!$userLTI) {
            $this->logger->error("unable to get/create user file LTI");

            return false;
        }

        /**
         * Update the fields for the user
         *
         * TODO: probably want to change the "totalPercentPoint" calculation method.
         */
        $userLTI->totalComments++;
        $userLTI->isSyncd = false;

        /**
         * Save the new data back to disk
         */
        if (!$this->__saveUserToDisk($userFile, $userLTI)) {
            $this->logger->error("unable to save newly updated user data back to disk");

            return false;
        }

        /**
         * Try to submit the current state to blackboard
         */
        if (!$this->__submitBlackBoardLTI($userLTI)) {
            $this->logger->error("error when trying to submit user data to BlackBoard");

            return false;
        }

        /**
         * Submission was successful, so update more fields
         */
        $userLTI->isSyncd             = true;
        $userLTI->timestampSubmitToBB = time();

        /**
         * Save back to disk again
         */
        if (!$this->__saveUserToDisk($userFile, $userLTI)) {
            $this->logger->error("unable to save updated user data back to disk");

            return false;
        }

        return true;
    }

    /**
     * Post the data back to blackboard LTI with the saved post data & using the LTI library.
     */
    private function __submitBlackBoardLTI($userLTI)
    {
        // Require the LTI common code
        require $_SERVER["DOCUMENT_ROOT"] . "/LTI/LTI.php";

        // Parse out the lti data from raw post data
        $lti          = new LTI();
        $dataFromPost = $lti->getDataFromPost(json_decode(json_encode($userLTI->postData), true));

        // Check if there was an error when parsing
        if ($dataFromPost->isError) {
            $this->logger->error("error occured from getDataFromPost when trying to submit to blackboard lti");

            return false;
        }

        /**
         * Calculate what the grade percentage needs to be
         * 5 max pts.
         * 2 current pts (1 per comment)
         * 2 / 5
         */
        $gradePercentage = $userLTI->totalComments / $userLTI->maxPoints;

        // Send the grade to BlackBoard, & check if it was successful
        if (!$lti->isSuccessful($lti->sendGrade($dataFromPost->url, $dataFromPost->id, $gradePercentage))) {
            $this->logger->error("send grade failed in submit blackboard lti");

            return false;
        }

        return true;
    }

    /**
     * Get users' LTI data for the work.
     * Look at __getUserCreateIfNeeded to create file if needed
     */
    private function __getUser($workPathLTI, $userEppn)
    {
        $userFile = $workPathLTI . "/" . $userEppn . ".json";
        if (!is_file($userFile)) {
            return false;
        }

        $userLTI = file_get_contents($userFile);
        if (!$userLTI) {
            $this->logger->error("unable to get user LTI file, expected it existed");

            return false;
        }

        $userObjLTI = json_decode($userLTI);
        if ($userObjLTI == null) {
            $this->logger->error("unable to decode read user LTI file");

            return false;
        }

        return $userObjLTI;
    }

    /**
     * Get users' LTI data for the work, or create a new one if not exists.
     *
     * returns false on error,
     * returns user lti obj on success
     */
    private function __getUserCreateIfNeeded($workPathLTI, $postData, $maxPts)
    {
        /**
         * Create main lti data dir for the work if needed
         */
        if (!is_dir($workPathLTI)) {
            if (!mkdir($workPathLTI, 0777, true)) {
                $this->logger->error("unable to create LTI directory in specified work.");

                return false;
            }
        }

        $userFile = $workPathLTI . "/" . $this->currentEppn . ".json";
        if (!is_file($userFile)) {
            $userLTI     = new DefaultUserLTI($this->currentEppn, $this->currentFirstName, $this->currentLastName, $postData, $maxPts);
            $userJsonLTI = json_encode($userLTI);

            if (!file_put_contents($userFile, $userJsonLTI)) {
                $this->logger->error("unable to create user lti file in work, when necessary");

                return false;
            }

            return $userLTI;
        }

        $userLTI = file_get_contents($userFile);
        if (!$userLTI) {
            $this->logger->error("unable to get user LTI file, expecte it existed");

            return false;
        }

        $userObjLTI = json_decode($userLTI);
        if ($userObjLTI == null) {
            $this->logger->error("unable to decode read user LTI file");

            return false;
        }

        /**
         * Update the existing user LTI file with new POST data
         */
        $userObjLTI->postData = $postData;

        if (!$this->__saveUserToDisk($userFile, $userObjLTI)) {
            $this->logger->error("unable to save new user post data back to disk");

            return false;
        }

        return $userObjLTI;
    }

    /**
     * Save the user LTI obj back to disk
     */
    private function __saveUserToDisk($userFile, $userLTI)
    {
        // Write back to file
        $userJsonUpdated = json_encode($userLTI);

        if (!file_put_contents($userFile, $userJsonUpdated)) {
            $this->logger->error("unable to update existing user LTI file with new post data contents");

            return false;
        }

        return true;
    }
}

class DefaultUserLTI
{
    public function __construct($eppn, $first, $last, $postData, $maxPts)
    {
        $this->eppn                = $eppn;
        $this->firstName           = $first;
        $this->lastName            = $last;
        $this->maxPoints           = $maxPts;
        $this->totalComments       = 0; // 1
        $this->timestampSubmitToBB = 0; // the timestamp of the most recent submission to bb
        $this->isSyncd             = false; // is the current grade - sync'd/submitted to blackboard
        $this->postData            = $postData; // saved $_POST data from bb LTI. Raw form.
    }
}
