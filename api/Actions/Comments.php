<?php

/**
 * Comments class that contains methods used for editing/creating/deleting comments
 *
 * This class relies on Permissions.php to check whether a user is allowed to modify specified comment
 */
class Comments
{
    /**
     * Constructor for reusing objects and variables etc
     *
     * Uses the work name and its creator, instantiates a permissions object which is used by many of this classes functions
     *
     * @see userOnPermissionsList()
     *
     * @param String $work The work name
     * @param String $creator The EPPN of the creator of the specified work
     */
    public function __construct($logger, $path, $creator, $work)
    {
        require 'Permissions.php';
        $this->permissions = new Permissions($path);
        require 'UnapprovedComments.php';
        $this->unapprovedComments = new UnapprovedComments(
            $logger,
            $path,
            $creator,
            $work
        );
        $this->logger   = $logger;
        $this->path     = $path;
        $this->creator  = $creator;
        $this->work     = $work;
        $this->workPath = $path . $creator . "/works/" . $work;
    }

    /**
     * Method for editing an existing comment
     *
     * In addition to providing comment editing functionality, this method checks to see if the user has the proper permissions to edit said comment.
     *
     * @see Permissions.php
     *
     * @param String $creator The EPPN of the creator of the specified work
     * @param String $work The work name
     * @param String $commenterEppn The EPPN of the comment creator
     * @param String $hash The hash (unique ID) of the comment to edit
     * @param String $type The new "type" the comment should be (historical, question, analytical, definition...)
     * @param String $text The new comment-text that this comment should be changed to
     * @param Boolean $public True indicates that the work should be public and viewable to everyone. False indicates it should be viewable to only work admins
     * @param String $editorEppn The EPPN of the user attempting to edit the comment. Obtained via $_SERVER['eppn']... Used to check whether the user has permissions to edit the comment
     * @return JSON Representing the success status of editing a comment
     */
    public function editComment($creator, $work, $commenterEppn, $commentHash, $type, $text, $public, $editorEppn)
    {
        if (!($commenterEppn == $editorEppn || $this->permissions->userOnPermissionsList($this->workPath, $editorEppn))) {
            return json_encode(array(
                "status"  => "error",
                "message" => "only the comment creator can delete this comment",
            ));
        }

        $fileToModify = $this->__getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to find comment",
            ));
        }

        $jsonData = json_decode(file_get_contents($fileToModify));
        if ($public && $this->permissions->commentsNeedsApproval($this->workPath)) {
            /**
             * Auto-approve the comment if editorEppn is on the permissions list
             */
            if ($this->permissions->userOnPermissionsList($this->workPath, $editorEppn)) {
                $jsonData->approved = true;
            } else {
                $jsonData->approved = false;
                /**
                 * Register a comment with the unapproved "registry"
                 */
                $ancestorData = $this->__getFirstLevelMetaFromCommentPath($fileToModify);
                if (is_int($ancestorData) && $ancestorData == -1) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to get ancestor info for the new comment",
                    ));
                }
                if (!$this->unapprovedComments->registerUnapprovedComment($ancestorData["eppn"], $ancestorData["hash"], $commenterEppn, $commentHash, $fileToModify)) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to unregister an unapproved comment",
                    ));
                }
            }
        }
        $jsonData->commentText = $text;
        $jsonData->commentType = $type;

        if (file_put_contents($fileToModify, json_encode($jsonData))) {
            return json_encode(array(
                "status"  => "ok",
                "message" => "successfully edited comment",
            ));
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "an error occurred while trying to edit the comment",
            ));
        }
    }

    /**
     * Delete a comment
     *  -> must be owner of the comment || must be on the permissions list of the work
     *    IF the comment has children threads, will set it to the text "<i>comment deleted</i>"
     *      and set a property in the comment.json 'deleted => true'
     *    ELSE the comment has no children threads, so the comment.json file gets deleted.
     */
    public function deleteComment($creator, $work, $commenterEppn, $commentHash, $readerEppn)
    {
        $workPath = $this->path . $creator . "/works/" . $work;

        if (!($commenterEppn == $readerEppn || $this->permissions->userOnPermissionsList($workPath, $readerEppn))) {
            return json_encode(array(
                "status"  => "error",
                "message" => "only the comment creator can delete this comment",
            ));
        }

        $fileToModify = $this->__getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to find comment",
            ));
        }

        /** Remove the deleted comment from the unapproved registry */
        if (!$this->unapprovedComments->unregisterUnapprovedComment($commenterEppn, $commentHash)) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to unregister an unapproved comment",
            ));
        }

        $commentDirectoryHash = substr($fileToModify, 0, strrpos($fileToModify, "comment.json"));
        if (file_exists($commentDirectoryHash . "threads/") && !($this->__isCommentRoot($commentDirectoryHash))) {
            // comment has replies/threads - so don't delete the comment.json; replace the comment owner and text with 'deleted'
            $jsonData              = json_decode(file_get_contents($fileToModify));
            $jsonData->commentText = "deleted";
            $jsonData->firstName   = "deleted";
            $jsonData->lastName    = "deleted";
            $jsonData->deleted     = true;
            if (file_put_contents($fileToModify, json_encode($jsonData))) {
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "successfully deleted comment",
                ));
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "an error occurred while trying to delete the comment",
                ));
            }
        } else {
            if ($this->__deleteDir($commentDirectoryHash, true)) {
                $parentDeleted = !file_exists(dirname($commentDirectoryHash));
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "successfully deleted comment",
                ));
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "an error occurred while trying to delete the comment",
                ));
            }
        }
    }

    /**
     * Get the comment data and its children for a specific comment
     */
    public function getCommentChain($creator, $work, $commenter, $hash, $reader)
    {
        try {
            $commentFilePaths = $this->__getCommentFiles($creator, $work, true, $commenter, $hash);
        } catch (Exception $e) {
            return json_encode(array(
                "status"        => "error",
                "message"       => "unable to get comments",
                "raw_exception" => $e->getMessage(),
            ));
        }

        $commentTree = $this->__buildCommentJsonFromPaths($commentFilePaths, $reader, $creator, $work);
        $this->__recursivelyRemovePathProperty($commentTree);

        return json_encode(array(
            "status" => "ok",
            "data"   => $commentTree,
        ));
    }

    /**
     * Returns the meta data for first level comments
     */
    public function getHighlights($readerEppn)
    {
        return $this->__getCommentDataHighlights($readerEppn);
    }

    /**
     * Returns the meta data for first level comments
     * Akin to getHighlights() except that this function applies filtering
     */
    public function getHighlightsFiltered($readerEppn, $filterEppn, $filterType)
    {
        /**
         * Frontend no longer sends the filter with the first letter being uppercased
         */
        $filterType = ucfirst($filterType);

        /**
         * TODO: This can be improved by creating or adding filter functionality to getCommentFiles
         */
        $result = $this->__getCommentDataHighlights($readerEppn);

        $filtered = array();
        foreach ($result as $commentData) {
            if (($commentData["commentType"] == $filterType || $filterType == "") && ($commentData["eppn"] == $filterEppn || $filterEppn == "")) {
                $filtered[] = $commentData;
            }
        }

        return $filtered;
    }

    /**
     * Save a users' comment on a specified work
     * This method must check if the user has access to comment on specified work
     */
    public function saveComment(
        $workAuthor,
        $workName,
        $replyTo,
        $replyHash,
        $commenterEppn,
        $startIndex,
        $endIndex,
        $commentText,
        $commentType,
        $privacy,
        $commenterFirstName,
        $commenterLastName
    ) {
        $workPath = $this->path . $workAuthor . "/works/" . $workName;

        $approved = $this->__commentabilityOfWork($workPath, $commenterEppn, $privacy);
        if ($approved == -1) {
            return json_encode(array(
                "status"  => "error",
                "message" => "invalid permission to comment",
            ));
        } elseif ($approved == 0) {
            $approved = false; // for saving in comment object
        } else {
            $approved = true;
        }

        /**
         * Get the new comment file location
         * (Yes, this entire if/else block does that 1 thing)
         * Comments directly on a page (first level comments will send these values when saved)
         */
        $commentHash    = time();
        $newCommentPath = null;
        if (is_null($replyTo) && is_null($replyHash)) {
            // create new top level comment
            $lowestCommentPath = $workPath . "/data/threads/" . $commenterEppn;
            if (!is_dir($lowestCommentPath)) {
                mkdir($lowestCommentPath);
            }

            $newCommentPath = $lowestCommentPath . "/" . $commentHash;
            if (!is_dir($newCommentPath)) {
                mkdir($newCommentPath);
            }
        } else {
            // find the path to the specified comment we're replying to
            $commentPaths   = $this->__getCommentFiles($workAuthor, $workName, true);
            $replyPath      = null;
            $replyToEndPath = $replyTo . "/" . $replyHash . "/comment.json";
            $size           = strlen($replyToEndPath);

            foreach ($commentPaths as $path) {
                if (substr($path, -$size) == $replyToEndPath) {
                    $replyPath = substr($path, 0, strrpos($path, '/') + 1);
                    break;
                }
            }

            // unable to find the path for the comment to reply to
            if (!isset($replyPath)) {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to save comment",
                ));
            }

            // creating the directories/pathing for the new comment
            if (!is_dir($replyPath . "threads")) {
                mkdir($replyPath . "threads");
            }
            if (!is_dir($replyPath . "threads/" . $commenterEppn)) {
                mkdir($replyPath . "threads/" . $commenterEppn);
            }

            $newCommentPath = $replyPath . "threads/" . $commenterEppn . "/" . $commentHash;
            if (!is_dir($newCommentPath)) {
                mkdir($newCommentPath);
            }
        }

        $comment = new Comment(
            $privacy,
            $commentText,
            $startIndex,
            $endIndex,
            $commentType,
            $commenterFirstName,
            $commenterLastName,
            $commenterEppn,
            $approved
        );

        /**
         * Register the comment as unapproved with the unapproved DB
         */
        if (!$approved) {
            $ancestorData = $this->__getFirstLevelMetaFromCommentPath($newCommentPath);
            $this->unapprovedComments->registerUnapprovedComment(
                $ancestorData["eppn"],
                $ancestorData["hash"],
                $commenterEppn,
                $commentHash,
                $newCommentPath . "/comment.json"
            );
        }

        if (file_put_contents($newCommentPath . "/comment.json", json_encode($comment))) {
            return json_encode(array(
                "status"      => "ok",
                "message"     => "comment saved",
                "commentHash" => $commentHash,
                "approval"    => $approved,
            ));
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to save comment",
            ));
        }
    }

    /**
     * Returns an int representing the approval... Read pseudocode for explanation
     *
     * ~~ Pseudocode ~~
     * IF work is private:
     *      IF user on admin list:
     *          THEN approved = TRUE
     *      ELSE:
     *          THEN CANNOT COMMENT
     * ELSE (work is public)
     *      IF the comment is private ($privacy == false) // yes naming is wacky all around...
     *          THEN approved = TRUE // This means, changing the privacy will need approval before viewable by others in the future
     *      ELSE:
     *          IF the work "comments_require_approval == true"
     *              IF user on admin list: approved = TRUE
     *              ELSE approved = FALSE
     *          ELSE approved = TRUE
     *
     * @return -1: user isn't even allowed to comment on this work
     * @return 0: comment needs approval
     * @return 1: comment is approved (aka doesn't need approval to be post)
     */
    private function __commentabilityOfWork($workPath, $commenterEppn, $privacy)
    {
        if (!$this->permissions->isWorkPublic($workPath)) {
            if ($this->permissions->userOnPermissionsList($workPath, $commenterEppn)) {
                return 1;
            } else {
                return -1;
            }
        } else {
            if (!$privacy) {
                return 1;
            } else {
                if ($this->permissions->commentsNeedsApproval($workPath)) {
                    if ($this->permissions->userOnPermissionsList($workPath, $commenterEppn)) {
                        return 1;
                    } else {
                        return 0;
                    }
                } else {
                    return 1;
                }
            }
        }
    }

    /**
     * Set an existing comments' public status
     * $commenterEppn isn't required, but it's the $_SERVER['eppn'] ...
     */
    public function setCommentPublic($creator, $work, $commentHash, $commenterEppn, $privacy)
    {
        if (!in_array(json_encode($privacy), array('true', 'false'))) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to edit comment, unknown privacy",
            ));
        }

        $fileToModify = $this->__getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to edit comment",
            ));
        }

        $fileData         = json_decode(file_get_contents($fileToModify));
        $fileData->public = $privacy;
        if ($privacy) {
            /**
             * Work has become public, check if we need it to get approval
             *
             * IF work Wants comments to be approved
             *      THEN Approved = FALSE
             * ELSE
             *      THEN Approved = TRUE
             */
            $workPath = $this->path . $creator . "/works/" . $work;
            if ($this->permissions->commentsNeedsApproval($workPath)) {
                /**
                 * Check if user is on permissions list, for auto-approval
                 */
                if ($this->permissions->userOnPermissionsList($workPath, $commenterEppn)) {
                    $fileData->approved = true;
                } else {
                    $fileData->approved = false;
                    /**
                     * Register a comment with the unapproved "registry"
                     */
                    $ancestorData = $this->__getFirstLevelMetaFromCommentPath($fileToModify);
                    if (is_int($ancestorData) && $ancestorData == -1) {
                        return json_encode(array(
                            "status"  => "error",
                            "message" => "unable to get ancestor info for the new comment",
                        ));
                    }
                    if (!$this->unapprovedComments->registerUnapprovedComment($ancestorData["eppn"], $ancestorData["hash"], $commenterEppn, $commentHash, $fileToModify)) {
                        return json_encode(array(
                            "status"  => "error",
                            "message" => "unable to unregister an unapproved comment",
                        ));
                    }
                }
            } else {
                $fileData->approved = true;
                $ancestorData       = $this->__getFirstLevelMetaFromCommentPath($fileToModify);
                if (is_int($ancestorData) && $ancestorData == -1) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to get ancestor info for the new comment",
                    ));
                }
                /** Remove the deleted comment from the unapproved registry */
                if (!$this->unapprovedComments->unregisterUnapprovedComment($commenterEppn, $commentHash)) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to unregister an unapproved comment",
                    ));
                }
            }
        }

        if (file_put_contents($fileToModify, json_encode($fileData))) {
            return json_encode(array(
                "status"  => "ok",
                "message" => "successfully changed comment to " . json_encode($privacy),
            ));
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to edit comment",
            ));
        }
    }

    /**
     * Approves a comment.
     * Removes the file from the unapproved registry.
     * And sets the comments' "approved" property to "true".
     */
    public function approveComment($approverEppn, $creator, $work, $commentHash, $commenterEppn)
    {
        $fileToModify = $this->__getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to approve comment",
            ));
        }

        if ($this->permissions->userOnPermissionsList($this->workPath, $approverEppn)) {
            $fileData           = json_decode(file_get_contents($fileToModify));
            $fileData->approved = true;
            $fileData->public   = true; // For a comment to be unapproved - it must've been public to begin with... Leaving this here just in case though.
            if (file_put_contents($fileToModify, json_encode($fileData))) {
                /** Remove the deleted comment from the unapproved registry */
                if (!$this->unapprovedComments->unregisterUnapprovedComment($commenterEppn, $commentHash)) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to unregister an unapproved comment",
                    ));
                }
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "successfully approved comment",
                ));
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to approve comment",
                ));
            }
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to approve comment, no permission",
            ));
        }
    }

    /**
     * Approves a comment.
     * Removes the file from the unapproved registry.
     * And sets the comments' "approved" property to "true".
     */
    public function unapproveComment($approverEppn, $creator, $work, $commentHash, $commenterEppn)
    {
        $fileToModify = $this->__getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to approve comment",
            ));
        }

        /**
         * In contrary with approveComment(), the comment creator can unapprove it
         */
        if ($approverEppn == $commenterEppn || $this->permissions->userOnPermissionsList($this->workPath, $approverEppn)) {
            $fileData           = json_decode(file_get_contents($fileToModify));
            $fileData->approved = false;
            $fileData->public   = true; // For a comment to be unapproved - it must've been public to begin with... Leaving this here just in case though.
            if (file_put_contents($fileToModify, json_encode($fileData))) {
                $ancestorData = $this->__getFirstLevelMetaFromCommentPath($fileToModify);
                if (!$this->unapprovedComments->registerUnapprovedComment(
                    $ancestorData["eppn"],
                    $ancestorData["hash"],
                    $commenterEppn,
                    $commentHash,
                    $fileToModify
                )) {
                    return json_encode(array(
                        "status"  => "error",
                        "message" => "unable to register an unapproved comment",
                    ));
                }
                return json_encode(array(
                    "status"  => "ok",
                    "message" => "successfully unapproved comment",
                ));
            } else {
                return json_encode(array(
                    "status"  => "error",
                    "message" => "unable to unapprove comment",
                ));
            }
        } else {
            return json_encode(array(
                "status"  => "error",
                "message" => "unable to unapprove comment, no permission",
            ));
        }
    }

    /**
     * Gets comments that cover the specified index in their span range
     */
    public function getCommentsWithinIndex($readerEppn, $index)
    {
        $data = $this->__getCommentDataHighlights($readerEppn);

        $filteredContents = array();
        foreach ($data as $comment) {
            if ($index >= (int)$comment["startIndex"] && $index <= (int)$comment["endIndex"]) {
                $filteredContents[] = $comment;
            }
        }

        return $filteredContents;
    }

    /**
     * Get all the comment highlights
     */
    private function __getCommentDataHighlights($readerEppn)
    {
        try {
            $commentFilePaths = $this->__getCommentFiles($this->creator, $this->work, false);
        } catch (Exception $e) {
            $this->logger->error(sprintf("error: unable to get comments; message: %s", $e->getMessage()));
            return array();
        }

        return $this->__getFileMetaData($commentFilePaths, $readerEppn);
    }

    /**
     * Path property in a comment is needed to construct the comments in the proper order.
     * Once the object is created with all the linkings, we can then remove the path.
     * CANNOT remove path property while the tree is being built. Only once the entire tree has been constructed...
     *
     * This function removes the path property recursively
     */
    private function __recursivelyRemovePathProperty(&$commentChain)
    {
        foreach ($commentChain as $comment) {
            unset($comment->path);
            $this->__recursivelyRemovePathProperty($comment->threads);
        }
    }

    /**
     * Returns meta data of the given file-comment paths
     * No comment text, just frontend positional logic of the comments (for highlighting)
     *
     * @param array $arrayOfFullCommentPath array of full file paths to comments
     * @return array
     */
    private function __getFileMetaData($arrayOfFullCommentPath, $reader)
    {
        $data = array();
        foreach ($arrayOfFullCommentPath as $filePath) {
            $jsonData = json_decode(file_get_contents($filePath . "/comment.json"));

            /**
             * Below logic taken from $this->buildCommentJsonFromPaths()
             */
            if ($jsonData->public) {
                // comment is public
                if ($jsonData->approved) {
                    // comment is approved
                    array_push($data, array(
                        "startIndex"         => $jsonData->startIndex,
                        "endIndex"           => $jsonData->endIndex,
                        "commentType"        => $jsonData->commentType,
                        "eppn"               => $jsonData->eppn,
                        "hash"               => end(explode("/", $filePath)),
                        "approved"           => $jsonData->approved,
                        "unapprovedChildren" => $this->__doesCommentHaveUnapprovedReplies(
                            $jsonData->eppn, end(explode("/", $filePath))
                        ),
                    ));
                } else {
                    // comment is not approved
                    // only work admins should be able to see it OR the creator of the comment
                    if ($this->permissions->userOnPermissionsList($this->workPath, $reader) || $reader == $jsonData->eppn) {
                        // reader is admin so can see the comment
                        array_push($data, array(
                            "startIndex"         => $jsonData->startIndex,
                            "endIndex"           => $jsonData->endIndex,
                            "commentType"        => $jsonData->commentType,
                            "eppn"               => $jsonData->eppn,
                            "hash"               => end(explode("/", $filePath)),
                            "approved"           => $jsonData->approved,
                            "unapprovedChildren" => $this->__doesCommentHaveUnapprovedReplies(
                                $jsonData->eppn, end(explode("/", $filePath))
                            ),
                        ));
                    } else {
                        // reader is not an admin, so can't see the comment
                    }
                }
            } else {
                // comment is private
                // only the comment creator should be able to see it
                if ($jsonData->eppn == $reader) {
                    // comment creator is also the reader
                    array_push($data, array(
                        "startIndex"         => $jsonData->startIndex,
                        "endIndex"           => $jsonData->endIndex,
                        "commentType"        => $jsonData->commentType,
                        "eppn"               => $jsonData->eppn,
                        "hash"               => end(explode("/", $filePath)),
                        "unapprovedChildren" => $this->__doesCommentHaveUnapprovedReplies(
                            $jsonData->eppn, end(explode("/", $filePath))
                        ),
                    ));
                } else {
                    // no one else can see this comment
                }
            }
        }

        return $data;
    }

    /**
     * Get the path of a comment.json file by the commentCreatorEppn and commentHash (and work creator & work name)
     */
    private function __getCommentPathByHash($creator, $work, $commentHash, $commenterEppn)
    {
        $replyToEndPath = $commenterEppn . "/" . $commentHash . "/comment.json";

        $commentPaths = $this->__getCommentFiles($creator, $work, true);
        foreach ($commentPaths as $path) {
            $position = strrpos($path, $replyToEndPath);
            if ($position) {
                return $path;
            }
        }

        return false;
    }

    /**
     * Builds the JSON content of comment files - given an array of file paths
     *
     *      [DONE] Show public & private comments to the comment-creator
     *
     *      [DONE] Show public & unapproved comments to admins
     *
     *      [DONE] Show public & approved comments to everyone
     */
    private function __buildCommentJsonFromPaths(&$commentFilePaths, $readerEppn, $creator, $work)
    {
        $workPath = $this->path . $creator . "/works/" . $work;

        usort($commentFilePaths, 'self::__sortByLengthInc');
        $comments = array();

        foreach ($commentFilePaths as $filePath) {
            $jsonData          = json_decode(file_get_contents($filePath));
            $jsonData->path    = $filePath;
            $jsonData->threads = array();

            // Recusively check if the $filePath is a subpath of an existing path in $comment...
            // Uses references to not lose the original object... But be able to change the 'pointer' of where we want to write data to
            $commentsPointer =& $comments;
            if (($amt = $this->__isThreadOf($filePath, $commentsPointer)) == -1) {
                // inserts first level comments of the work (highlighted comments. NOT comments of comments)
                if ($jsonData->public) {
                    // comment is public
                    if ($jsonData->approved) {
                        // comment is approved
                        $jsonData->hash = $this->__getEppnHashFromPath($jsonData->path, "hash");
                        array_push($commentsPointer, $jsonData);
                    } else {
                        // comment is not approved
                        // only work admins should be able to see it OR the creator of the comment themselves
                        if ($this->permissions->userOnPermissionsList($workPath, $readerEppn) || $readerEppn == $jsonData->eppn) {
                            // reader is admin so can see the comment
                            $jsonData->hash     = $this->__getEppnHashFromPath($jsonData->path, "hash");
                            $jsonData->approved = false; // this is "just in case" it's set to something else other than true/false
                            array_push($commentsPointer, $jsonData);
                        } else {
                            // reader is not an admin, so can't see the comment
                        }
                    }
                } else {
                    // comment is private
                    // only the comment creator should be able to see it
                    if ($jsonData->eppn == $readerEppn) {
                        // comment creator is also the reader
                        $jsonData->hash = $this->__getEppnHashFromPath($jsonData->path, "hash");
                        array_push($commentsPointer, $jsonData);
                    } else {
                        // no one else can see this comment
                    }
                }
            } else {
                // recursively iterate through the next level comments and see if they 'fit' in a pre-existing higher level comment
                // if $jsonData == NULL, then we've finally found a spot for the comment in the $comments tree...
                while ($jsonData != null) {
                    if (($amt2 = $this->__isThreadOf($filePath, $commentsPointer[$amt]->threads)) == -1) {
                        $jsonData->isReply = true; // NOT NECESSARY FOR BACKEND. This was wanted by frontend development
                        // checking if the comment is hidden of not (only show the public == false comments to the owner of the comment)
                        if ($jsonData->public) {
                            // comment is public
                            if ($jsonData->approved) {
                                // comment is approved
                                $jsonData->hash = $this->__getEppnHashFromPath($jsonData->path, "hash");
                                array_push($commentsPointer[$amt]->threads, $jsonData);
                            } else {
                                // comment is not approved
                                // only work admins should be able to see it OR the creator of the comment themselves
                                if ($this->permissions->userOnPermissionsList($workPath, $readerEppn) || $readerEppn == $jsonData->eppn) {
                                    // reader is admin so can see the comment
                                    $jsonData->hash     = $this->__getEppnHashFromPath($jsonData->path, "hash");
                                    $jsonData->approved = false; // this is just in casse it's set to something else other than true/false
                                    array_push($commentsPointer[$amt]->threads, $jsonData);
                                } else {
                                    // reader is not an admin, so can't see the comment
                                }
                            }
                        } else {
                            // comment is private
                            // only the comment creator should be able to see it
                            if ($jsonData->eppn == $readerEppn) {
                                // comment creator is also the reader
                                $jsonData->hash = $this->__getEppnHashFromPath($jsonData->path, "hash");
                                array_push($commentsPointer[$amt]->threads, $jsonData);
                            } else {
                                // no one else can see this comment
                            }
                        }
                        $jsonData = null;
                    } else {
                        $commentsPointer =& $commentsPointer[$amt]->threads;
                        $amt             = $amt2;
                    }
                }
            }
        }

        return $comments;
    }

    /**
     * Checks if the $path is inside $array, {NOT!!!!} if the entire length of $path is covered by a value in $array...
     * Rather, if the $path is a continuation of any of the existing arrays...
     */
    private function __isThreadOf($path, &$array)
    {
        usort($array, 'self::__sortByLengthDec');
        $count = 0;
        foreach ($array as $somePath) {
            $truncatedPath = substr($somePath->path, 0, strrpos($somePath->path, '/'));
            // maybe use preg_match ? ... I don't think it's necessary,... but maybe when comment nesting gets extremely large it'd cause issues with strrpos?
            if (strpos($path, $truncatedPath) !== false) {
                return $count;
            }

            ++$count;
        }

        return -1;
    }

    /**
     * Recursive starter function...
     * Returns an array of all the file paths to comment.json files that're associated with $author and $work
     *
     * NOTE: specifying a $commenter and $hash only works when $recursive = TRUE
     */
    private function __getCommentFiles($author, $work, $recursive, $commenter = null, $hash = null)
    {
        $initialFiles    = array();
        $baseCommentPath = $this->path . "$author/works/$work/data/threads";
        if ($recursive) {
            return $this->__getCommentFilesRecursivelyHelper($baseCommentPath, $initialFiles, $commenter, $hash);
        } else {
            foreach (array_values(array_diff(scandir($baseCommentPath), array('.', '..'))) as $user) {
                $initialFiles = array_merge($initialFiles, glob($baseCommentPath . "/" . $user . "/*"));
            }
            return $initialFiles;
        }
    }

    /**
     * Recursive helper function in getting the comment-file paths for a specified 'thread' directory path
     */
    private function __getCommentFilesRecursivelyHelper($thread, &$commentsList, $commenter = null, $hash = null)
    {
        $files = array_diff(scandir($thread), array('.', '..'));

        foreach ($files as $userPost) {
            $timestampedDirs = array_diff(scandir("$thread/$userPost"), array('.', '..'));

            foreach ($timestampedDirs as $timestampedDir) {
                if (is_null($commenter) && is_null($hash)) {
                    array_push($commentsList, "$thread/$userPost/$timestampedDir/comment.json");

                    if (is_dir("$thread/$userPost/$timestampedDir/threads")) {
                        $this->__getCommentFilesRecursivelyHelper("$thread/$userPost/$timestampedDir/threads", $commentsList);
                    }
                } else {
                    if ($commenter == $userPost && $timestampedDir == $hash) {
                        array_push($commentsList, "$thread/$userPost/$timestampedDir/comment.json");

                        if (is_dir("$thread/$userPost/$timestampedDir/threads")) {
                            $this->__getCommentFilesRecursivelyHelper("$thread/$userPost/$timestampedDir/threads", $commentsList);
                        }
                    }
                }
            }
        }

        return $commentsList;
    }

    /**
     * Sort an arrays' contents by length (increasing length)
     * For usage with 'usort'
     * e.g: usort($array, 'sortByLength');
     */
    private function __sortByLengthInc($a, $b)
    {
        return strlen($a) - strlen($b);
    }

    private function __sortByLengthDec($a, $b)
    {
        return strlen($b->path) - strlen($a->path);
    }

    private function __getEppnHashFromPath($path, $type = null)
    {
        $array = array_reverse(explode("/", $path));

        if (is_null($type)) {
            return array(
                'eppn' => $array[2],
                'hash' => $array[1],
            );
        } elseif ($type == "hash") {
            return $array[1];
        } elseif ($type == "eppn") {
            return $array[2];
        } else {
            // error
            return array(
                'eppn' => $array[2],
                'hash' => $array[1],
            );
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

    private function __isCommentRoot($dirPath)
    {
        $afterDataDir = preg_split("/data/", $dirPath);

        return ($this->__dirLength($afterDataDir[1]) == 5);
    }

    /*
     * Counts slashes to find directory depth
     */
    private function __dirLength($dirPath)
    {
        return count(preg_split("/\//", $dirPath));
    }

    /**
     * Gets the top/first level commenterEppn & commentHash from a comment path
     *
     * @return array || @return int -1 on error
     */
    private function __getFirstLevelMetaFromCommentPath($commentPath)
    {
        $dirs = (explode("/", $commentPath));
        if (count($dirs) < 4) {
            return -1;
        }
        for ($i = 0; $i < count($dirs); $i++) {
            if ($dirs[$i] == "data") {
                if (!array_key_exists($i + 3, $dirs)) {
                    return -1;
                }
                if ($dirs[$i + 1] == "threads") {
                    return array(
                        "eppn" => $dirs[$i + 2],
                        "hash" => $dirs[$i + 3],
                    );
                }
            }
        }
        return -1;
    }

    /**
     * Returns TRUE when the specified @param $ancestorEppn & @param $ancestorHash
     * are matches with any unapproved comments' ancestor data.
     *
     * TODO: We can optimize this function by rebuilding getAllUnapprovedCommentData() inline.
     * Read file by file and parse out the properties after each file read...
     * Rather than read everything then parse 1 by 1.
     *
     * @return bool
     */
    private function __doesCommentHaveUnapprovedReplies($ancestorEppn, $ancestorHash)
    {
        foreach ($this->unapprovedComments->getAllUnapprovedCommentData() as $unapprovedCommentData) {
            if ($unapprovedCommentData->AncestorEppn == $ancestorEppn && $unapprovedCommentData->AncestorHash == $ancestorHash) {
                return true;
            }
        }
        return false;
    }

    /**
     * Read callee function in index.php
     */
    public function tempFunctionToCreateUnapprovedDirs($creator, $work)
    {
        // delete unapproved dir if it already exists
        if (is_dir($this->workPath . "/unapproved")) {
            if (!$this->__deleteDir($this->workPath . "/unapproved", true)) {
                return "error clearing dir";
            }
        }

        $filePaths = $this->__getCommentFiles($creator, $work, true);
        foreach ($filePaths as $path) {
            $data = json_decode(file_get_contents($path));
            if ($data->approved != true) {
                $ancestorData = $this->__getFirstLevelMetaFromCommentPath($path);
                $this->unapprovedComments->registerUnapprovedComment(
                    $ancestorData["eppn"],
                    $ancestorData["hash"],
                    $data->eppn,
                    $this->__getEppnHashFromPath($path, "hash"),
                    $path
                );
            }
        }
        return "done";
    }
}

class Comment
{
    public function __construct(
        $privacy,
        $commentText,
        $startIndex,
        $endIndex,
        $commentType,
        $firstName,
        $lastName,
        $eppn,
        $approved = false
    ) {
        $this->public      = $privacy;
        $this->commentText = $commentText;
        $this->startIndex  = $startIndex;
        $this->endIndex    = $endIndex;
        $this->commentType = $commentType;
        $this->firstName   = $firstName;
        $this->lastName    = $lastName;
        $this->eppn        = $eppn;
        $this->approved    = $approved;
    }
}
