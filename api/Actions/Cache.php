<?php

class Cache
{
    public function __construct($logger, $path, $creator, $work)
    {
        $this->logger = $logger;
        $this->path = $path;
        $this->creator = $creator;
        $this->work = $work;

        $this->cacheDir = "caches";
    }

    /**
     * Get all cache entries
     */
    public function getAll()
    {

    }

    /**
     * Get a cache entry
     */
    public function get($key)
    {

    }

    /**
     * Create a new cache entry
     */
    public function set($key, $value)
    {

    }

    /**
     * Remove a cache entry
     */
    public function clear($key)
    {

    }

    /**
     * Create the cache directory
     * 
     * @throws error in log
     * @return bool
     */
    private function createDir()
    {
        if (!is_dir($this->unapprovedDirPath)) {
            $res = mkdir($this->unapprovedDirPath, 0777, TRUE);
            if (!$res) {
                $this->logger->error(
                    "Unable to create unapproved directory: ($this->unapprovedDirPath)\n
                    Error: " . error_get_last()
                );
                return FALSE;
            }
        }
        return TRUE;
    }
}