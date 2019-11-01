function showTutorialPage() {
    $(".headerTab").removeClass("active");
    $("#tutorial").addClass("active");
    hideAllBoxes();
    disableSettingPage();
    componentHandler.upgradeAllRegistered();
    //TODO change it later
    $("#text, #nonTitleContent, #settingBase, #addLitBase").hide();
    $("#tutorialBase").show();
    $(".selectorOpener").remove();

    $(".tutorialOption").off().on("click", (evt) => {
        //showTutorialPage();
        //determine which tutroial it is by the number
        let tutorialNum = evt["currentTarget"]["children"][0]["innerText"].split(" ")[0].split("")[1];
        tutorial(tutorialNum);
        evt.stopPropagation();
        //open or make an example page first
        //then add the tutorials and run it
        //after complete direct it back to the tutorial page
    });
}

function startTutorial(tutorialData, specialStepData) {
    console.log("start")
    introJs().start().onafterchange(function (targetElement) {
        //specialStepsAction(targetElement,specialStepData);
    }).onbeforechange(function (targetElement) {
        specialStepsAction(targetElement, specialStepData);
    }).onexit(function () {
        removeTutorial(tutorialData);
        // homeButtonAction();
        showTutorialPage();
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
            //TODO find a better way then just pass the thing
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

function waitTutorialCreation(tutorialData, specialStepData) {
    let intervalID = setInterval(function () {
        console.log(tutorialData, $(".dynamicTutorial").length)
        if ($(".dynamicTutorial").length == tutorialData.length) {
            clearInterval(intervalID);
            startTutorial(tutorialData, specialStepData);
        }
    }, 100);
}

async function tutorial(tutorialNum) {
    console.log("call tutorial")
    let allData = await preTutorial(tutorialNum);
    //TODO see if anything needs special steps
    await makeTutorial(allData[0]);
    waitTutorialCreation(allData[0], allData[1]);
}

async function preTutorial(tutorialNum) {
    console.log("preTutoiral called")
    if (tutorialNum == 1) {
        showAddLitPage();
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
        // TODO open the example page (if there is an api for this, it will be nice)
        selectLit("shihclin@stonybrook.edu", "Example");
        var tutorialData = [
            ["#litDiv", 1, "Highlight content to start a discussion"],
            [".commented-selection:first", 2, "Click on the highlights to view the discussion"],
            [".typeSelector", 3, "You can filter the discussions with their categories"],
            [".commenterSelector", 4, "You can also filter by the creator of the discussion"],
            [".tipsIcon", 5, "Hover to the question mark to see what the colored text indicates"]
        ];
        var specialStepData = {
            3: "$('.selectorOpener').click()"
        };
        return data = [tutorialData, specialStepData];
    }
    else if (tutorialNum == 3) {
        selectLit("shihclin@stonybrook.edu", "Example");
        $(".commented-selection:first").click();
        var tutorialData = [
            [".commented-selection:first", 1, "Click on the highlights to view the discussion"],
            ["#replies", 2, "You can view the discussion in the reply box"],
            [".toolBar:first", 3, "All the action you can do with the discussions is in toolbar"]
        ];
        var specialStepData = {
            2: "$('.commented-selection.dynamicTutorial').click()"
        }
        return data = [tutorialData, specialStepData];
    }
    else {
        console.log("something else than add lit tutorial")
    }
}
