<?php

require('components/WorkDetailsComponent.php');

class WorkDetails {

	public function __construct($eppn, $params) {
		$method = $params->get('method');

		/** WorkDetails Component Object */
		$workDetails = new WorkDetailsComponent($eppn);

		if ($method == 'listWorks') { // eventually have another listWorks method -- checks if current user is an 'admin' and if a 'specifyEPPN' is supplied; then show for that user and not the current logged in
			echo $workDetails->listWorks();
		} elseif ($method == 'workData') {
			echo $workDetails->getWorkData($params->get('project'));
		} else {

		}
	}

}
