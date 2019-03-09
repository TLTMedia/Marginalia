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

    }

    // private function recursiveGetComments(&$commentStack, $)
    // {
    //
    // }

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
                return true;
            }
        }

        return false;
    }
}

class FirstLevelComment
{
    public function __construct(
        $visibility,
        $commentText,
        $startIndex,
        $endIndex,
        $commentType
    ) {
        $this->visibility = $visibility;
        $this->commentText = $commentText;
        $this->startIndex = $startIndex;
        $this->endIndex = $endIndex;
        $this->commentType = $commentType;
    }
}
