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
    public function __construct($creator, $work)
    {
        require 'Permissions.php';
        $this->permissions = new Permissions;
        $this->workPath = __PATH__ . $creator . "/works/" . $work;
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
     * @param String $commenter The EPPN of the comment creator
     * @param String $hash The hash (unique ID) of the comment to edit
     * @param String $type The new "type" the comment should be (historical, question, analytical, definition...)
     * @param String $text The new comment-text that this comment should be changed to
     * @param Boolean $public True indicates that the work should be public and viewable to everyone. False indicates it should be viewable to only work admins
     * @param String $editor The EPPN of the user attempting to edit the comment. Obtained via $_SERVER['eppn']... Used to check whether the user has permissions to edit the comment
     * @return JSON Representing the success status of editing a comment
     */
    public function editComment($creator, $work, $commenter, $hash, $type, $text, $public, $editor)
    {
        if (!($commenter == $editor || $this->permissions->userOnPermissionsList($this->workPath, $editor))) {
            return json_encode(array(
                "status" => "error",
                "message" => "only the comment creator can delete this comment"
            ));
        }

        $fileToModify = $this->getCommentPathByHash($creator, $work, $hash, $commenter);
        if (!$fileToModify) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to find comment"
            ));
        }

        $jsonData = json_decode(file_get_contents($fileToModify));
        if ($public && $this->permissions->commentsNeedsApproval($this->workPath)) {
            $jsonData->approved = false;
        }
        $jsonData->commentText = $text;
        $jsonData->commentType = $type;

        if (file_put_contents($fileToModify, json_encode($jsonData))) {
            return json_encode(array(
                "status" => "ok",
                "message" => "successfully edited comment"
            ));
        } else {
            return json_encode(array(
                "status" => "error",
                "message" => "an error occurred while trying to edit the comment"
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
    public function deleteComment($creator, $work, $commenter, $hash, $reader)
    {
        $workPath = __PATH__ . $creator . "/works/" . $work;

        if (!($commenter == $reader || $this->permissions->userOnPermissionsList($workPath, $reader))) {
            return json_encode(array(
                "status" => "error",
                "message" => "only the comment creator can delete this comment"
            ));
        }

        $fileToModify = $this->getCommentPathByHash($creator, $work, $hash, $commenter);
        if (!$fileToModify) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to find comment"
            ));
        }

        $commentDirectoryHash = substr($fileToModify, 0, strrpos($fileToModify, "comment.json"));
        if (file_exists($commentDirectoryHash . "threads/") && !($this->isCommentRoot($commentDirectoryHash))) {
            // comment has replies/threads - so don't delete the comment.json; replace the comment owner and text with 'deleted'
            $jsonData = json_decode(file_get_contents($fileToModify));
            $jsonData->commentText = "deleted";
            $jsonData->firstName = "deleted";
            $jsonData->lastName = "deleted";
            $jsonData->deleted = true;
            if (file_put_contents($fileToModify, json_encode($jsonData))) {

                return json_encode(array(
                    "status" => "ok",
                    "message" => "successfully deleted comment"
                ));
            } else {
                return json_encode(array(
                    "status" => "error",
                    "message" => "an error occurred while trying to delete the comment"
                ));
            }
        } else {
            if ($this->deleteDir($commentDirectoryHash, true)) {
                $parentDeleted = !file_exists(dirname($commentDirectoryHash));


                return json_encode(array(
                    "status" => "ok",
                    "message" => "successfully deleted comment"
                ));
            } else {
                return json_encode(array(
                    "status" => "error",
                    "message" => "an error occurred while trying to delete the comment"
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
            $commentFilePaths = $this->getCommentFiles($creator, $work, true, $commenter, $hash);
        } catch (Exception $e) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to get comments",
                "raw_exception" => $e->getMessage()
            ));
        }

        $commentTree = $this->buildCommentJsonFromPaths($commentFilePaths, $reader, $creator, $work);
        $this->recursivelyRemovePathProperty($commentTree);

        return json_encode(array(
            "status" => "ok",
            "data" => $commentTree
        ));
    }

    /**
     * Returns the meta data for first level comments
     */
    public function getHighlights($creator, $work, $reader)
    {
        try {
            $commentFilePaths = $this->getCommentFiles($creator, $work, false);
        } catch (Exception $e) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to get comments",
                "raw_exception" => $e->getMessage()
            ));
        }

        return json_encode(array(
            "status" => "ok",
            "data" => $this->getFileMetaData($commentFilePaths, $reader)
        ));
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
        $workPath = __PATH__ . $workAuthor . "/works/" . $workName;

        $approved = $this->commentabilityOfWork($workPath, $commenterEppn, $privacy);
        if ($approved == -1) {
            return json_encode(array(
                "status" => "error",
                "message" => "invalid permission to comment"
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
        if (is_null($replyTo) && is_null($replyHash)) {
            // create new top level comment
            $lowestCommentPath = $workPath . "/data/threads/" . $commenterEppn;
            if (!is_dir($lowestCommentPath)) {
                mkdir($lowestCommentPath);
            }

            $commentHash = time();
            $newCommentPath = $lowestCommentPath . "/" . $commentHash;
            if (!is_dir($newCommentPath)) {
                mkdir($newCommentPath);
            }
        } else {
            // find the path to the specified comment we're replying to
            $commentPaths = $this->getCommentFiles($workAuthor, $workName, true);
            $replyPath = null;
            $replyToEndPath = $replyTo . "/" . $replyHash . "/comment.json";
            $size = strlen($replyToEndPath);

            foreach ($commentPaths as $path) {
                if (substr($path, -$size) == $replyToEndPath) {
                    $replyPath = substr($path, 0, strrpos($path, '/') + 1);
                    break;
                }
            }

            // unable to find the path for the comment to reply to
            if (!isset($replyPath)) {
                return json_encode(array(
                    "status" => "error",
                    "message" => "unable to save comment"
                ));
            }

            // creating the directories/pathing for the new comment
            if (!is_dir($replyPath . "threads")) {
                mkdir($replyPath . "threads");
            }
            if (!is_dir($replyPath . "threads/" . $commenterEppn)) {
                mkdir($replyPath . "threads/" . $commenterEppn);
            }
            $commentHash = time();
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

        if (file_put_contents($newCommentPath . "/comment.json", json_encode($comment))) {
            return json_encode(array(
                "status" => "ok",
                "message" => "comment saved",
                "commentHash" =>  $commentHash
            ));
        } else {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to save comment"
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
    private function commentabilityOfWork($workPath, $commenterEppn, $privacy)
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
        $fileToModify = $this->getCommentPathByHash($creator, $work, $commentHash, $commenterEppn);
        if (!$fileToModify) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to edit comment"
            ));
        }

        $fileData = json_decode(file_get_contents($fileToModify));
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
            $workPath = __PATH__ . $creator . "/works/" . $work;
            if ($this->permissions->commentsNeedsApproval($workPath)) {
                $fileData->approved = false;
            } else {
                $fileData->approved = true;
            }
        }

        if (file_put_contents($fileToModify, json_encode($fileData))) {
            return json_encode(array(
                "status" => "ok",
                "data" => "successfully changed comment to " . json_encode($privacy)
            ));
        } else {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to edit comment"
            ));
        }
    }

    /**
     * Path property in a comment is needed to construct the comments in the proper order.
     * Once the object is created with all the linkings, we can then remove the path.
     * CANNOT remove path property while the tree is being built. Only once the entire tree has been constructed...
     *
     * This function removes the path property recursively
     */
    private function recursivelyRemovePathProperty(&$commentChain)
    {
        foreach ($commentChain as $comment) {
            unset($comment->path);
            $this->recursivelyRemovePathProperty($comment->threads);
        }
    }

    /**
     * Returns meta data of the given file-comment paths
     * @param  array $arrayOfFullCommentPath array of full file paths to comments
     * @return array JSON of the meta data for each of the comment files... no comment text, just location of the comments
     */
    private function getFileMetaData($arrayOfFullCommentPath, $reader)
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
                    array_push(
                        $data,
                        array(
                            "startIndex" => $jsonData->startIndex,
                            "endIndex" => $jsonData->endIndex,
                            "commentType" => $jsonData->commentType,
                            "eppn" => $jsonData->eppn,
                            "hash" => end(explode("/", $filePath)),
                        )
                    );
                } else {
                    // comment is not approved
                    // only work admins should be able to see it OR the creator of the comment
                    if ($this->permissions->userOnPermissionsList($this->workPath, $reader) || $reader == $jsonData->eppn) {
                        // reader is admin so can see the comment
                        array_push(
                            $data,
                            array(
                                "startIndex" => $jsonData->startIndex,
                                "endIndex" => $jsonData->endIndex,
                                "commentType" => $jsonData->commentType,
                                "eppn" => $jsonData->eppn,
                                "hash" => end(explode("/", $filePath)),
                            )
                        );
                    } else {
                        // reader is not an admin, so can't see the comment
                    }
                }
            } else {
                // comment is private
                // only the comment creator should be able to see it
                if ($jsonData->eppn == $reader) {
                    // comment creator is also the reader
                    array_push(
                        $data,
                        array(
                            "startIndex" => $jsonData->startIndex,
                            "endIndex" => $jsonData->endIndex,
                            "commentType" => $jsonData->commentType,
                            "eppn" => $jsonData->eppn,
                            "hash" => end(explode("/", $filePath)),
                        )
                    );
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
    private function getCommentPathByHash($creator, $work, $commentHash, $commenterEppn)
    {
        $replyToEndPath = $commenterEppn . "/" . $commentHash . "/comment.json";

        $commentPaths = $this->getCommentFiles($creator, $work, true);
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
    private function buildCommentJsonFromPaths(&$commentFilePaths, $readerEppn, $creator, $work)
    {
        $workPath = __PATH__ . $creator . "/works/" . $work;

        usort($commentFilePaths, 'self::sortByLengthInc');
        $comments = array();

        foreach ($commentFilePaths as $filePath) {
            $jsonData = json_decode(file_get_contents($filePath));
            $jsonData->path = $filePath;
            $jsonData->threads = array();

            // Recusively check if the $filePath is a subpath of an existing path in $comment...
            // Uses references to not lose the original object... But be able to change the 'pointer' of where we want to write data to
            $commentsPointer = &$comments;
            if (($amt = $this->isThreadOf($filePath, $commentsPointer)) == -1) {
                // inserts first level comments of the work (highlighted comments. NOT comments of comments)
                if ($jsonData->public) {
                    // comment is public
                    if ($jsonData->approved) {
                        // comment is approved
                        $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
                        array_push($commentsPointer, $jsonData);
                    } else {
                        // comment is not approved
                        // only work admins should be able to see it OR the creator of the comment themselves
                        if ($this->permissions->userOnPermissionsList($workPath, $readerEppn) || $readerEppn == $jsonData->eppn) {
                            // reader is admin so can see the comment
                            $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
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
                        $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
                        array_push($commentsPointer, $jsonData);
                    } else {
                        // no one else can see this comment
                    }
                }
            } else {
                // recursively iterate through the next level comments and see if they 'fit' in a pre-existing higher level comment
                // if $jsonData == NULL, then we've finally found a spot for the comment in the $comments tree...
                while ($jsonData != null) {
                    if (($amt2 = $this->isThreadOf($filePath, $commentsPointer[$amt]->threads)) == -1) {
                        $jsonData->isReply = true; // NOT NECESSARY FOR BACKEND. This was wanted by frontend development
                        // checking if the comment is hidden of not (only show the public == false comments to the owner of the comment)
                        if ($jsonData->public) {
                            // comment is public
                            if ($jsonData->approved) {
                                // comment is approved
                                $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
                                array_push($commentsPointer[$amt]->threads, $jsonData);
                            } else {
                                // comment is not approved
                                // only work admins should be able to see it OR the creator of the comment themselves
                                if ($this->permissions->userOnPermissionsList($workPath, $readerEppn) || $readerEppn == $jsonData->eppn) {
                                    // reader is admin so can see the comment
                                    $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
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
                                $jsonData->hash = $this->getEppnHashFromPath($jsonData->path, "hash");
                                array_push($commentsPointer[$amt]->threads, $jsonData);
                            } else {
                                // no one else can see this comment
                            }
                        }
                        $jsonData = null;
                    } else {
                        $commentsPointer = &$commentsPointer[$amt]->threads;
                        $amt = $amt2;
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
    private function isThreadOf($path, &$array)
    {
        usort($array, 'self::sortByLengthDec');
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
     * Recursive starter function... returns an array of all the file paths to comment.json files that're associated with $author and $work
     *
     * NOTE: specifying a $commenter and $hash only works when $recursive = TRUE
     */
    private function getCommentFiles($author, $work, $recursive, $commenter = null, $hash = null)
    {
        $initialFiles = array();
        $baseCommentPath = __PATH__ . "$author/works/$work/data/threads";
        if ($recursive) {
            return $this->getCommentFilesRecursivelyHelper($baseCommentPath, $initialFiles, $commenter, $hash);
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
    private function getCommentFilesRecursivelyHelper($thread, &$commentsList, $commenter = null, $hash = null)
    {
        $files = array_diff(scandir($thread), array('.', '..'));

        foreach ($files as $userPost) {
            $timestampedDirs = array_diff(scandir("$thread/$userPost"), array('.', '..'));

            foreach ($timestampedDirs as $timestampedDir) {
                if (is_null($commenter) && is_null($hash)) {
                    array_push($commentsList, "$thread/$userPost/$timestampedDir/comment.json");

                    if (is_dir("$thread/$userPost/$timestampedDir/threads")) {
                        $this->getCommentFilesRecursivelyHelper("$thread/$userPost/$timestampedDir/threads", $commentsList);
                    }
                } else {
                    if ($commenter == $userPost && $timestampedDir == $hash) {
                        array_push($commentsList, "$thread/$userPost/$timestampedDir/comment.json");

                        if (is_dir("$thread/$userPost/$timestampedDir/threads")) {
                            $this->getCommentFilesRecursivelyHelper("$thread/$userPost/$timestampedDir/threads", $commentsList);
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
    private function sortByLengthInc($a, $b)
    {
        return strlen($a) - strlen($b);
    }

    private function sortByLengthDec($a, $b)
    {
        return strlen($b->path) - strlen($a->path);
    }

    private function getEppnHashFromPath($path, $type = null)
    {
        $array = array_reverse(explode("/", $path));

        if (is_null($type)) {
            return array(
                'eppn' => $array[2],
                'hash' => $array[1]
            );
        } elseif ($type == "hash") {
            return $array[1];
        } elseif ($type == "eppn") {
            return $array[2];
        } else {
            // error
            return array(
                'eppn' => $array[2],
                'hash' => $array[1]
            );
        }
    }

    private static function deleteDir($dirPath, $removeEmptyParent)
    {
        if (!is_dir($dirPath)) {
            return false;
        }
        if (substr($dirPath, strlen($dirPath) - 1, 1) != '/') {
            $dirPath .= '/';
        }
        $files = glob($dirPath . '{,.}[!.,!..]*', GLOB_MARK|GLOB_BRACE);
        foreach ($files as $file) {
            if (is_dir($file)) {
                self::deleteDir($file, false);
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
    private function isCommentRoot($dirPath)
    {
        $afterDataDir=preg_split("/data/", $dirPath);

        return ($this->dirLength($afterDataDir[1])) ==5;
    }
    //count slashes to find directory depth
    private function dirLength($dirPath)
    {
        return count(preg_split("/\//",$dirPath));
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
        $this->public = $privacy;
        $this->commentText = $commentText;
        $this->startIndex = $startIndex;
        $this->endIndex = $endIndex;
        $this->commentType = $commentType;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->eppn = $eppn;
        $this->approved = $approved;
    }
}
