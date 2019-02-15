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

	/**
	 * @throws Exception
	 */
	public function get($argName) {
		parse_str($this->args, $params);

		if (!array_key_exists($argName, $params)) {
			throw new Exception('Could not find the argument name "' . $argName . '"');
		}

		return $params[$argName];
	}

}
