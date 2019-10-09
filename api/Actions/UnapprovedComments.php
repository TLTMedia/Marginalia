<?php

class UnapprovedComments
{
    /**
     * Unapproved comments for the specific work
     */
    public function __construct($logger, $path, $creator, $work)
    {
        $this->unapprovedDir     = "unapproved";
        $this->logger            = $logger;
        $this->creator           = $creator;
        $this->work              = $work;
        $this->workPath          = $path . $creator . "/works/" . $work;
        $this->unapprovedDirPath = $this->workPath . "/" . $this->unapprovedDir;
        $this->fileExtension     = ".json";
    }

    /**
     * Adds an unapproved comment to the unapproved directory
     *
     * @return bool | TRUE on sucess, FALSE on failure; read logs for why.
     */
    public function registerUnapprovedComment($ancestorEppn, $ancestorHash, $commenterEppn, $commentHash, $commentPath)
    {
        $this->logger->info("registering an unapproved comment!");
        $newUnapprovedComment = new DefaultUnapprovedComment(
            $ancestorEppn,
            $ancestorHash,
            $commenterEppn,
            $commentHash,
            $commentPath
        );
        $filename = $commenterEppn . "." . $commentHash . "." . "unapproved" . $this->fileExtension;
        return $this->__putContent($filename, json_encode($newUnapprovedComment));
    }

    /**
     * Removes an unapproved comment from the metadata file.
     *
     * @return bool | TRUE on success, FALSE on failure
     */
    public function unregisterUnapprovedComment($commenterEppn, $commentHash)
    {
        $filename = $commenterEppn . "." . $commentHash . "." . "unapproved" . $this->fileExtension;
        if (!file_exists($this->unapprovedDirPath . "/" . $filename)) {
            return true;
        }
        return unlink($this->unapprovedDirPath . "/" . $filename);
    }

    /**
     * Returns an array of the unapproved comment file data
     *
     * @return array || @return json
     */
    public function getAllUnapprovedCommentData()
    {
        $commentData = array();
        foreach ($this->getUnapprovedCommentFiles() as $file) {
            $data = $this->__getUnapprovedCommentData($file);
            if ($data == "") {
                // error getting data; check logs
                continue;
            }
            $commentData[] = $data;
            // array_push($commentData, $data);
        }
        return $commentData;
    }

    /**
     * Returns an array of unapproved comment files
     *
     * @return array of unapproved comment file names in the unapproved directory
     */
    public function getUnapprovedCommentFiles()
    {
        return glob($this->unapprovedDirPath . "/*" . $this->fileExtension);
    }

    /**
     * Atomic File Writer - Creates file if not exists
     * Kind of unnecessarily safe for this approach.
     * Mostly meant to be a helper function.
     *
     * "Reader and writer functions that serve stale"
     * https://tqdev.com/2018-locking-file-cache-php
     *
     * @return bool
     */
    private function __putContent($filename, $data)
    {
        if (!$this->__createIfNotExistsUnapprovedDir()) {
            // check log for why
            return false;
        }
        $tempfile = $this->unapprovedDirPath . "/" . $filename . uniqid(rand(), true);
        $result   = file_put_contents($tempfile, $data);
        $result   = $result && rename($tempfile, $this->unapprovedDirPath . "/" . $filename);
        return $result;
    }

    /**
     * File open reader helper
     * returns the content held by the specified file in the unapproved directory
     * Assumes the file exists
     *
     * @throws error in log
     * @return json $fileData
     */
    private function __getUnapprovedCommentData($filename)
    {
        $fh = fopen($filename, "r");
        if (!$fh) {
            $this->logger->error(
                "Unable to open unapproved file data at: ($filename)\n
                Error: " . error_get_last()
            );
            return "";
        }
        $fileData = fread($fh, filesize($filename));
        if (!$fileData) {
            $this->logger->error(
                "Unable to read unapproved file data at: ($filename)\n
                Error: " . error_get_last()
            );
            return "";
        }
        fclose($fh);
        return json_decode($fileData);
    }

    /**
     * Create the unapproved directory
     *
     * @throws error in log
     * @return bool
     */
    private function __createIfNotExistsUnapprovedDir()
    {
        if (!is_dir($this->unapprovedDirPath)) {
            $res = mkdir($this->unapprovedDirPath, 0777, true);
            if (!$res) {
                $this->logger->error(
                    "Unable to create unapproved directory: ($this->unapprovedDirPath)\n
                    Error: " . error_get_last()
                );
                return false;
            }
        }
        return true;
    }
}

/**
 * Default unapproved comment class
 */
class DefaultUnapprovedComment
{
    public function __construct(
        $ancestorEppn,
        $ancestorHash,
        $commenterEppn,
        $commentHash,
        $commentPath,
        $comment = ""
    ) {
        /**
         * 'Ancestor' Eppn/Hash defines the first-level comment to this comment.
         * If this comment is a first level comment, then its ancestor Eppn/Hash
         * are the same as its own. Otherwise, this comment is a reply to another comment...
         *
         * NOTE: Ancestor does not imply its direct parent. It implies the first original comment of its chain.
         */
        $this->AncestorEppn = $ancestorEppn;
        $this->AncestorHash = $ancestorHash;

        $this->CommenterEppn = $commenterEppn;
        $this->CommentHash   = $commentHash;
        $this->CommentPath   = $commentPath;

        // TODO: do we want/need to restore the content of the comment?
        $this->Comment = $comment;
    }
}
