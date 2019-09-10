<?php

class Metadata 
{
    /**
     * Metadata for the specific work
     */
    public function __construct($logger, $path, $creator, $work)
    {
        $this->metadataFileName = "metadata.json";
        $this->logger = $logger;
        $this->creator = $creator;
        $this->work = $work;
        $this->workPath = $path . $creator . "/works/" . $work;
        $this->metadataPath = $this->workPath . "/" . $this->metadataFileName;
    }

    /**
     * Check whether the specified comment has any children that are unapproved.
     * 
     * @return bool
     */
    public function parentHasUnapprovedChildren()
    {
        return FALSE;
    }

    /**
     * Returns the given param bool, but also removes/adds the comment from the metadata file.
     *
     * @return bool
     * @return int -1 on error
     */
    public function applyApproved($approved, $commenterEppn, $commentHash)
    {
        if ($approved) {
            if (!$this->removeUnapprovedComment($commenterEppn, $commentHash)) {
                $this->logger->error("Unable to remove comment from unapproval list");
                return -1;
            } else {
                return $approved;
            }
        } else {
            if (!$this->addUnapprovedComment($commentEppn, $commentHash)) {
                $this->logger->error("Unable to add comment from unapproval list");
                return -1;
            } else {
                return $approved;
            }
        }

        return $approved;
    }

    /**
     * Adds an unapproved comment to the metadata file.
     * 
     * @return bool | TRUE on sucess, FALSE on failure; read logs for why.
     */
    public function addUnapprovedComment($commenterEppn, $commentHash)
    {
        $metadata = $this->getMetadataContent();
        if ($metadata == "") {
            return FALSE;
        }
        $fileData = json_decode($metadata);
        if ($fileData->unapprovedComments[$commenterEppn] == NULL) {
            $fileData->unapprovedComments[$commenterEppn] = array(
                $commentHash => NULL
            );
        } else {
            $fileData->unapprovedComments[$commenterEppn][$commentHash] = NULL;
        }
        return $this->putMetadataContent(json_encode($fileData));
    }

    /**
     * Removes an unapproved comment from the metadata file.
     * 
     * @return bool | TRUE on success, FALSE on failure; read logs for why.
     */
    public function removeUnapprovedComment($commenterEppn, $commentHash)
    {
        $metadata = $this->getMetadataContent();
        if ($metadata == "") {
            return FALSE;
        }
        $fileData = json_decode($metadata);
        unset($fileData->unapprovedComments[$commenterEppn][$commentHash]);
        return $this->putMetadataContent(json_encode($fileData));
    }

    /**
     * DO NOT use this function in other functions (if they write).
     * Get the unapproved comments with a functions' own read/getMetadataContent() call.
     * Meant for API calls, do not include in other Backend logic that writes to files.
     * 
     * Returns an array of the unapproved comments belonging to a work
     * [
     *   key: value,
     *   ...
     * ]
     * Where key is the commenters' eppn, and value is the hash of the comment...
     * Rational: hash is simply a timestamp, so to further uniquely identify a comment, 
     * we match it with its creators eppn.
     */
    public function getUnapprovedComments()
    {
        $metadata = $this->getMetadataContent();
        if ($metadata == "") {
            // error reached; should've been logged
            return array();
        }

        $metadataJson = json_decode($metadata);
        return $metadataJson->unapprovedComments;
    }

    /**
     * Atomic File Write
     * 
     * "Reader and writer functions that serve stale"
     * https://tqdev.com/2018-locking-file-cache-php
     * 
     * TODO:
     * I'm pretty sure file data can still be overwritten...
     * e.g.)
     *  person 1: getMetadata() - person 1 has copy of the metadata.
     *  person 2: getMetadata() - person 2 also has a copy of the metadata.
     *  person 1: putMetadata() - person 1 updated the metadata file.
     *  person 2: putMetadata() - person 2 updated the metadata file, 
     *   which overwrite the changes person 1 made.
     * 
     * This at-least, will stop file-data from being corrupted and half-written... 
     * @return bool
     */
    private function putMetadataContent($newData)
    {
        $tempfile = $this->metadataPath . uniqid(rand(), true);
        $result = file_put_contents($tempfile, $newData);
        $result = $result && rename($tempfile, $this->metadataPath);
        return $result;
    }

    /**
     * File open reader helper
     * @return string $fileData
     */
    private function getMetadataContent()
    {
        if (!$this->doesMetadataExist()) {
            if (!$this->createMetadata()) {
                return "";
            }
        }
        $metaFh = fopen($this->metadataPath, "r");
        if (!$metaFh) {
            $this->logger->error(
                "Unable to open metadata file at: ($this->metadataPath)\n
                Error: " . error_get_last()
            );
            return "";
        }
        $fileData = fread($metaFh, filesize($this->metadataPath));
        if (!$fileData) {
            $this->logger->error(
                "Unable to read metadata file at: ($this->metadataPath)\n
                Error: " . error_get_last()
            );
            return "";
        }
        fclose($metaFh);
        return $fileData;
    }

    /**
     * Checks whether the metadata file exists for the objects' work.
     * Returns FALSE if it does not exist. Returns TRUE if it does.
     * @return bool
     */
    private function doesMetadataExist()
    {
        return file_exists($this->workPath . "/" . $this->metadataFileName);
    }

    /**
     * Create the metadata file, assuming that it doesn't already exist.
     * @return bool
     */
    private function createMetadata()
    {
        $metaFh = fopen($this->metadataPath, "w");
        if (!$metaFh) {
            $this->logger->error(
                "Unable to create new metadata file at path: ($this->metadataPath)\n
                Error: " . error_get_last()
            );
            return FALSE;
        }
        if (!fwrite($metaFh, json_encode(new DefaultMetadata))) {
            $this->logger->error(
                "Unable to write to new metadata file at path: ($this->metadataPath)\n
                Error: " . error_get_last()
            );
            return FALSE;
        }
        fclose($metaFh);
        return chmod($this->metadataPath, 0666);
    }

    /**
     * TODO: Caching implemented here too
     */
    // every time a new comment is created on a work (even replies), add its path to the file
    // public function addFullCommentPath()

}

/**
 * Default metadata object
 */
class DefaultMetadata
{
    public function __construct()
    {
        /**
         * Array of comments that are not approved
         * Structure: array[
         *      commenter1sEppn: [
         *          "hash of comment1"
         *      ],
         *      commenter2sEppn: [
         *          "hash of comment1",
         *          "hash of comment2",
         *          "hash of comment3"
         *      ]
         * ]
         */
        $this->unapprovedComments = array();

        /**
         * Array of comment file-paths... So we don't need to recusively get them each time...
         */
        $this->commentPathDbCache = array();
    }
}