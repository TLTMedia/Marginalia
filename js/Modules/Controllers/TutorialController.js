export class TutorialController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/TutorialController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * TODO: was showTutorialPage()
     * Show the tutorial page/modal
     * TODO:
     */
    show_tutorial_page() {
        componentHandler.upgradeAllRegistered();

        $("#tutorial-modal").modal({
            closeClass: 'icon-remove',
            closeText: '!',
        });

        $(".selectorOpener").remove();
        $(".tutorialOption").off().on("click", event => {
            //determine which tutroial it is by the number
            let tutorialNum = event["currentTarget"]["children"][0]["innerText"].split(" ")[0].split("")[1];
            console.log("doing tutorial #", tutorialNum);
            console.log(this.ui)
            $.modal.close();
            this.tutorial(tutorialNum);
            event.stopPropagation();
            //open or make an example page first
            //then add the tutorials and run it
            //after complete direct it back to the tutorial page
        });
    }

    /**
     * TODO: was startTutorial()
     * Start the tutorial & handle ending it.
     */
    start_tutorial(tutorialData, specialStepData) {
        introJs().start().onbeforechange(targetElement => {
            this.steps_action(targetElement, specialStepData);
        }).onexit(() => {
            $.modal.close();
            hideAllBoxes();
            this.remove_tutorial(tutorialData);
            $("#home").click();
            this.show_tutorial_page();
        });
    }

    /**
     * TODO: was removeTutorial()
     * Cleans up tutorial classes & attributes once a tutorial is complete.
     */
    remove_tutorial(tutorialData) {
        console.log("removing", tutorialData);

        for (let step in tutorialData) {
            let tutorial = tutorialData[step];
            $(tutorial[0]).removeAttr("data-step data-intro");
            $(tutorial[0]).removeClass("dynamicTutorial");
        }
    }

    /**
     * TODO: was makeTutorial()
     * TODO: make this better.
     */
    async make_tutorial(tutorialData) {
        for (let step in tutorialData) {
            let tutorial = tutorialData[step];
            let intervalID = setInterval(() => {
                if ($(tutorial[0]).length) {
                    clearInterval(intervalID);
                    $(tutorial[0]).addClass("dynamicTutorial")
                    $(tutorial[0]).attr({
                        "data-step": tutorial[1],
                        "data-intro": tutorial[2]
                    });
                }
            }, 100);
        }

        return tutorialData;
    }

    /**
     * TODO: was specialStepsAction()
     */
    steps_action(targetElement, specialStepData) {
        console.log(targetElement);

        if (specialStepData != undefined) {
            let currentStep = $(targetElement).attr("data-step");
            // nextStep = parseInt(currentStep)+1;
            if (specialStepData[currentStep] != undefined) {
                //TODO find a better way then just pass the string
                // let action = specialStepData[currentStep][0];
                // let target = specialStepData[currentStep][1];
                // if(action == "click"){
                //   console.log(target)
                //     $(target).click();
                // }
                console.log(specialStepData[currentStep])
                eval(specialStepData[currentStep]);
            }
        }
    }

    /**
     * TODO: was waitTutorialCreation()
     */
    wait_for_creation(tutorialData, specialStepData) {
        console.log("wait_for_creation()", tutorialData, specialStepData);

        let intervalID = setInterval(() => {
            console.log(tutorialData, $(".dynamicTutorial").length);

            if ($(".dynamicTutorial").length == tutorialData.length) {
                clearInterval(intervalID);
                this.start_tutorial(tutorialData, specialStepData);
            }
        }, 100);
    }

    /**
     * TODO: was tutorial()
     */
    async tutorial(tutorialNum) {
        console.log("call tutorial");

        let allData = await this.pre_tutorial(tutorialNum);
        //TODO see if anything needs special steps
        await this.make_tutorial(allData[0]);
        this.wait_for_creation(allData[0], allData[1]);
    }

    /**
     * TODO: was preTutorial()
     */
    async pre_tutorial(tutorialNum) {
        console.log("preTutoiral called", tutorialNum);

        if (tutorialNum == 1) {
            $("#litadd").click();
            var tutorialData = [
                [".fileContainer", 1, "Select a file from your device"],
                [".nameContainer", 2, "Name your work"],
                [".addLitCourseMenu", 3, "Select a course that you want to upload your work for"],
                [".privateContainer", 4, "Check the box if you want your work to be private. (you are able to change your work's privacy after you upload it)"],
                ["#addUploadButton", 5, "Click to upload"]
            ];
            let specialStepData = {};
            return [tutorialData, specialStepData];
        } else if (tutorialNum == 2) {
            //TODO make a example page for tutorial
            this.ui.state.selected_creator = "shihclin@stonybrook.edu";
            this.ui.ui_events.click_work_option("Example");

            // TODO open the example page (if there is an api for this, it will be nice)
            var tutorialData = [
                ["#litDiv", 1, "Highlight content to start a discussion"],
                [".commented-selection:first", 2, "Click on the highlights to view the discussion"],
                ["#type-filters", 3, "You can filter the discussions with their categories"],
                ["#author-filters", 4, "You can also filter by the creator of the discussion"],
                [".tipsIcon", 5, "Hover to the question mark to see what the colored text indicates"]
            ];
            var specialStepData = {
            };
            return [tutorialData, specialStepData];
        } else if (tutorialNum == 3) {
            //TODO make a example page for tutorial temporary HARD CODED
            this.ui.state.selected_creator = "shihclin@stonybrook.edu";
            this.ui.ui_events.click_work_option("Example");
            let data = {
                "work": "Example",
                "author": "shihclin@stonybrook.edu",
                "commentCreator": "shihclin@stonybrook.edu",
                "commentId": 1573666037,
                "commentType": "Comment",
                "evtPageX": 100,
                "evtPageY": 100,
                "evtClientY": 100
            }
            clickOnCommentByIndex(data);
            // also open the first discussion
            var tutorialData = [
                [".commented-selection:first", 1, "Click on the highlights to view the discussion"],
                ["#replies", 2, "You can view the discussion in the reply box"],
                ["#ui-id-2", 3, "The type of this discussion is shown here"],
                [".toolBar:first", 4, "All the action you can do with the discussions is in toolbar"]
            ];
            var specialStepData = {
                2:" $('#replies').parent().show();"
            };
            return [tutorialData, specialStepData];
        } else if (tutorialNum == 4) {
            //TODO  HARDED CODED
            this.ui.state.selected_course = "WRT 102 - Fall 2019";
            this.ui.state.selected_creator = "shihclin@stonybrook.edu";
            this.ui.state.selected_work = "Example";
            this.ui.show_settings();
            var tutorialData = [
                [".select2-whitelist-select", 1, "Click on this to manage the white list (People that are able to approve other people's comments)"],
                [".settingDataButton", 2, "Click on this to check the data about the current work"],
                [".deleteWorkButton", 3, "Click on this to delete the current work"],
                [".privacySwitch", 4, "Toggle the switch to set the privacy for current work"],
                [".commentsNeedApprovalSwitch", 5, "Toggle the switch to make all the comments in the current work require approval"]
            ];
            var specialStepData = {};
            return [tutorialData, specialStepData];
        } else {
            console.log("something else than add lit tutorial")
        }
    }
}
