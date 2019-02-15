<?php

class WorkDetailsComponent {

	/**
	 * The 'email' address of the logged in user
	 * @var string
	 */
	private $eppn;

	public function __construct($eppn) {
		$this->eppn = $eppn;
	}

	/**
	 * Returns a list of all the projects/works of the current eppn...
	 */
	public function listWorks() {
		// holds an array of all the works in the user's(eppn) directory
		$allWorks = array();

		// loop through the contents of the directory and push the names of each into $allWorks
		foreach(glob("../users/$this->eppn/works/*") as $work) {
			$workName = substr($work, strrpos($work, '/') + 1);
			array_push($allWorks, $workName);
		}

		return json_encode($allWorks);
	}

	/**
	 * Returns the contents of a file in the current $eppn's directory
	 */
	public function getWorkData($fileName) {
		// path of the file
		$filePath = "../users/$this->eppn/works/$fileName";

		// check if the file exists before trying to read it
		if (file_exists($filePath)) {
			return file_get_contents($filePath);
		} else {
			return "Specified project does not exist";
		}
	}
}
