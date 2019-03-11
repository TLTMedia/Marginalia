<?php

class Comments
{
    /**
     * Save a users' comment on a specified work
     * This method must check if the user has access to comment on specified work
     */
    public function saveComment($workAuthor, $workName, $replyTo, $replyHash, $commenterName, $startIndex, $endIndex, $commentText, $commentType)
    {
        $visibility = $this->userOnModList(__PATH__ . "$workAuthor/works/$workName", $commenterName);

        $lowestCommentPath = __PATH__ . "$workAuthor/works/$workName/data/threads/$commenterName";
        if (!is_dir($lowestCommentPath)) {
            mkdir($lowestCommentPath);
        }

        $newCommentPath = $lowestCommentPath . "/" . time();
        if (!is_dir($newCommentPath)) {
            mkdir($newCommentPath);
        }

        $comment = new FirstLevelComment($visibility, $commentText, $startIndex, $endIndex, $commentType);
        if (file_put_contents($newCommentPath . "/comment.json", json_encode($comment))) {
            return json_encode(array(
                "status" => "ok",
                "message" => "comment saved"
            ));
        } else {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to save comment"
            ));
        }
    }

    /**
     * Get visible comments and related info to them for a specific work belonging to a user
     * ... helper function to a recursive function?
     */
    public function getComments($author, $work)
    {
        try {
            $commentFilePaths = $this->getCommentFilesRecursively($author, $work);
        } catch(Exception $e) {
            return json_encode(array(
                "status" => "error",
                "message" => "unable to get comments",
                "raw_exception" => $e->getMessage()
            ));
        }

        return json_encode(array(
            "status" => "ok",
            "data" => $this->buildCommentJsonFromPaths($commentFilePaths)
        ));
    }

    /**
     * Builds the JSON content of comment files - given an array of file paths
     */
    private function buildCommentJsonFromPaths(&$commentFilePaths)
    {
        usort($commentFilePaths, 'self::sortByLengthInc');
        $comments = array();

        foreach ($commentFilePaths as $filePath) {
            $jsonData = json_decode(file_get_contents($filePath));
            $jsonData->path = $filePath;
            $jsonData->threads = array();

            // Recusively check if the $filePath is a subpath of an existing path in $comment...
            // Uses references to not lose the original object... But be able to change the 'pointer' of where we want to write data to
            $commentsPointer = &$comments;
            if (($amt = $this->pathIsContinuation($filePath, $commentsPointer)) == -1) {
                array_push($commentsPointer, $jsonData);
            } else {
                // if $jsonData == NULL, then we've finally found a spot for the comment in the $comments tree...
                while ($jsonData != NULL) {
                    if (($amt2 = $this->pathIsContinuation($filePath, $commentsPointer[$amt]->threads)) == -1) {
                        array_push($commentsPointer[$amt]->threads, $jsonData);
                        $jsonData = NULL;
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
    private function pathIsContinuation($path, &$array)
    {
        usort($array, 'self::sortByLengthDec');
        $count = 0;
        foreach ($array as $somePath) {
            $truncatedPath = substr($somePath->path, 0, strrpos($somePath->path, '/'));
            // maybe use preg_match ? ... I don't think it's necessary,... but maybe when comment nesting gets extremely large it'd cause issues with strrpos?
            if (strpos($path, $truncatedPath) !== FALSE) {
                return $count;
            }

            ++$count;
        }

        return -1;
    }

    /**
     * Recursive starter function... returns an array of all the file paths to comment.json files that're associated with $author and $work
     */
    private function getCommentFilesRecursively($author, $work)
    {
        $initialFiles = array();
        return $this->getCommentFilesRecursivelyHelper(__PATH__ . "$author/works/$work/data/threads", $initialFiles);
    }

    /**
     * Recursive helper function in getting the comment-file paths for a specified 'thread' directory path
     */
    private function getCommentFilesRecursivelyHelper($thread, &$commentsList)
    {
        $files = array_diff(scandir($thread), array('.', '..'));

        foreach ($files as $userPost) {
            $timestampedDirs = array_diff(scandir("$thread/$userPost"), array('.', '..'));

            foreach ($timestampedDirs as $timestampedDir) {
                array_push($commentsList, "$thread/$userPost/$timestampedDir/comment.json");

                if (is_dir("$thread/$userPost/$timestampedDir/threads")) {
                    $this->getCommentFilesRecursivelyHelper("$thread/$userPost/$timestampedDir/threads", $commentsList);
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

    /**
     * permissions.php contains list of people who's comments are auto approved and they also can maintain comment approval/visibility
     */
    private function userOnModList($pathOfWork, $user)
    {
        require 'Permissions.php';
        $permissions = new Permissions;
        $userEditList = json_decode($permissions->getRawPermissionsList($pathOfWork))->admins;

        foreach ($userEditList as $validUser) {
            if ($user == $validUser) {
                return TRUE;
            }
        }

        return FALSE;
    }
}

class FirstLevelComment
{
    public function __construct(
        $visibility,
        $commentText,
        $startIndex,
        $endIndex,
        $commentType,
        $thread = NULL,
        $path = NULL
    ) {
        $this->visibility = $visibility;
        $this->commentText = $commentText;
        $this->startIndex = $startIndex;
        $this->endIndex = $endIndex;
        $this->commentType = $commentType;
        $this->thread = $thread;
        $this->path = $path;
    }

    public function populateByArray($array)
    {
        $this->visibility = $array['visibility'];
        $this->commentText = $array['commentText'];
        $this->startIndex = $array['startIndex'];
        $this->endIndex = $array['endIndex'];
        $this->commentType = $array['commentType'];
        $this->threads = array();
        $this->path = $array['path'];
    }
}
