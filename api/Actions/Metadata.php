<?php

class Metadata 
{
    /**
     * Metadata for the specific work
     */
    public function __construct($creator, $work)
    {
        $this->creator = $creator;
        $this->work = $work;
        $this->workPath = __PATH__ . $creator . "/works/" . $work;
    }

    // public function addUnapprovedCommentId()
    // public function removeUnapprovedCommentId()
    // public function getUnapprovedCommentIds()

    /**
     * TODO: Caching implemented here too
     */
    // every time a new comment is created on a work (even replies), add its path to the file
    // public function addFullCommentPath()

}