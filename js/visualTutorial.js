function showTutorialPage(ui) {
    let interfaceController = ui
    componentHandler.upgradeAllRegistered();
    /**
     * NOTE: Ilan changed this
     */
    $("#tutorial-modal").modal({
        closeClass: 'icon-remove',
        closeText: '!',
    });

    $(".selectorOpener").remove();
    $(".tutorialOption").off().on("click", (evt) => {
        //determine which tutroial it is by the number
        let tutorialNum = evt["currentTarget"]["children"][0]["innerText"].split(" ")[0].split("")[1];
        console.log("doing tutorial #", tutorialNum);
        console.log(ui)
        $.modal.close();
        tutorial(tutorialNum, interfaceController);
        evt.stopPropagation();
        //open or make an example page first
        //then add the tutorials and run it
        //after complete direct it back to the tutorial page
    });
}

function startTutorial(tutorialData, specialStepData, ui) {
    introJs().start().onbeforechange(function (targetElement) {
        specialStepsAction(targetElement, specialStepData);
    }).onexit(function () {
        $.modal.close();
        hideAllBoxes();
        removeTutorial(tutorialData);
        $("#home").click();
        showTutorialPage(ui);
    });
}

function removeTutorial(tutorialData) {
    console.log("removing", tutorialData)
    for (let step in tutorialData) {
        let tutorial = tutorialData[step];
        $(tutorial[0]).removeAttr("data-step data-intro");
        $(tutorial[0]).removeClass("dynamicTutorial");
    }
}

async function makeTutorial(tutorialData) {
    for (let step in tutorialData) {
        let tutorial = tutorialData[step];
        let intervalID = setInterval(function () {
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

function specialStepsAction(targetElement, specialStepData) {
    console.log(targetElement)
    if (specialStepData != undefined) {
        currentStep = $(targetElement).attr("data-step");
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

function waitTutorialCreation(tutorialData, specialStepData, ui) {
    let intervalID = setInterval(function () {
        console.log(tutorialData, $(".dynamicTutorial").length)
        if ($(".dynamicTutorial").length == tutorialData.length) {
            clearInterval(intervalID);
            startTutorial(tutorialData, specialStepData, ui);
        }
    }, 100);
}

async function tutorial(tutorialNum, ui) {
    console.log("call tutorial")
    let allData = await preTutorial(tutorialNum, ui);
    //TODO see if anything needs special steps
    await makeTutorial(allData[0]);
    waitTutorialCreation(allData[0], allData[1], ui);
}

async function preTutorial(tutorialNum, ui) {
    console.log("preTutoiral called")
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
        return data = [tutorialData, specialStepData];
    }
    else if (tutorialNum == 2) {
        //TODO make a example page for tutorial
        ui.state.selected_creator = "shihclin@stonybrook.edu";
        console.log(ui.state)
        ui.ui_events.click_work_option("", "Example");

        // TODO open the example page (if there is an api for this, it will be nice)
        var tutorialData = [
            ["#litDiv", 1, "Highlight content to start a discussion"],
            [".commented-selection:first", 2, "Click on the highlights to view the discussion"],
            ["#type-filters", 3, "You can filter the discussions with their categories"],
            ["#author-filters", 4, "You can also filter by the creator of the discussion"],
            [".tipsIcon", 5, "Hover to the question mark to see what the colored text indicates"]
        ];
        var specialStepData = {
            3: '$(".mdl-menu" + "[for = filters]").show();'
        };
        return data = [tutorialData, specialStepData];
    }
    else if (tutorialNum == 3) {
        //TODO make a example page for tutorial temporary HARD CODED
        ui.state.selected_creator = "shihclin@stonybrook.edu";
        ui.ui_events.click_work_option("", "Example");
        let data = {
            "work": "Example",
            "author": "shihclin@stonybrook.edu",
            "commentCreator": "shihclin@stonybrook.edu",
            "commentId": 1572021529,
            "commentType": "Historical",
            "evtPageX": 100,
            "evtPageY": 100,
            "evtClientY": 100
        }
        clickOnComment(data);
        // also open the first discussion
        var tutorialData = [
            [".commented-selection:first", 1, "Click on the highlights to view the discussion"],
            ["#replies", 2, "You can view the discussion in the reply box"],
            ["#ui-id-2", 3, "The type of this discussion is shown here"],
            [".toolBar:first", 4, "All the action you can do with the discussions is in toolbar"]
        ];
        var specialStepData = {};
        return data = [tutorialData, specialStepData];
    }
    else if (tutorialNum == 4) {
        //TODO  HARDED CODED
        ui.state.selected_course = "WRT 102 - Fall 2019";
        ui.state.selected_creator = "shihclin@stonybrook.edu";
        ui.state.selected_work = "Example";
        ui.show_settings();
        var tutorialData = [
            [".litWhiteListButton", 1, "Click on this to manage the white list (People that are able to approve other people's comments)"],
            [".settingDataButton", 2, "Click on this to check the data about the current work"],
            [".deleteWorkButton", 3, "Click on this to delete the current work"],
            [".privacySwitch", 4, "Toggle the switch to set the privacy for current work"],
            [".commentsNeedApprovalSwitch", 5, "Toggle the switch to make all the comments in the current work require approval"]
        ];
        var specialStepData = {};
        return data = [tutorialData, specialStepData];
    }
    else {
        console.log("something else than add lit tutorial")
    }
}
