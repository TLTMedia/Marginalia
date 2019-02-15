<?php

class Parameters {

	/**
	 * @var string
	 */
	private $args;

	public function __construct() {
		$this->args = $_SERVER['QUERY_STRING'];
	}

	public function getAll() {
		return $this->args;
	}

	public function get($argName) {
		parse_str($this->args, $params);

		if (!array_key_exists($argName, $params)) {
			echo "ERROR: Required argument '$argName' does not exist!";
			exit();
		}

		return $params[$argName];
	}

}
