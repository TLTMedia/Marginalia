<?php

class Parameters {
    /**
     * Checks whether parameters have been properly set
     */
    public function paramCheck($a, $b)
    {
        if (!array_equal(array_keys($a), $b)) {
            echo json_encode(array(
                "status" => "error",
                "message" => "invalid parameters"
            ));
            exit; // Maybe this is a good idea?
        }
    }

    /**
     * Returns true when the values of an array are equal
     * Ordering of array values don't matter.
     */
    public function array_equal($a, $b)
    {
    	return (
            is_array($a)
            && is_array($b)
            && count($a) == count($b)
            && array_diff($a, $b) === array_diff($b, $a)
    	);
    }

}
