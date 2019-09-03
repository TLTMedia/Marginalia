<?php

/**
 * Helpful and widely used functions for formatting data for API responses
 */
class APIResponse
{
    /**
     * Formats and returns the api data format which can be printed out directly
     */
    public function message($status, $message)
    {
        return json_encode(array(
            "status" => $status,
            "message" => $message
        ));
    }

    /**
     * Formats and prints out the api data format
     */
    public function printMessage($status, $message)
    {
        echo $this->message($status, $message);
    }

    /**
     * Parses the values of an array and returns a valid JSON object that can
     * be printed out to the API
     */
    public function arrayToAPIObject($array)
    {
        if (!in_array("status", $array)) {
            $array["status"] = "ok";
        }
        return json_encode($array);
    }
}
