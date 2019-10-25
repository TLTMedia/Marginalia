function startTutorial(tutorialData, specialStepData){
    introJs().start().onafterchange(function(targetElement){
        specialStepsAction(targetElement,specialStepData);
    }).onbeforechange(function(){

    }).onexit(function(){
        removeTutorial(tutorialData);
    });
}

function removeTutorial(tutorialData){
  console.log("removing",tutorialData)
    for (let step in tutorialData){
        let tutorial = tutorialData[step];
        $(tutorial[0]).removeAttr("data-step");
        $(tutorial[0]).removeAttr("data-intro");
    }
}

function makeTutorial(tutorialData){
    for(let step in tutorialData){
        let tutorial = tutorialData[step];
        $(tutorial[0]).attr({
          "data-step" : tutorial[1],
          "data-intro" : tutorial[2]
        });
    }
}

function specialStepsAction(targetElement,specialStepData){
    console.log(specialStepData)
    if(specialStepData != undefined){
        currentStep = $(targetElement).attr("data-step");
        nextStep = parseInt(currentStep)+1;
        if(specialStepData[nextStep] != undefined){
            let action = specialStepData[nextStep][0];
            let target = specialStepData[nextStep][1];
            console.log(target)
            if (action == "click"){
                // while(!$(target).is(":visible")){
                //     $(".introjs-nextbutton").addClass("introjs-disabled");
                // }
                // $(".introjs-nextbutton").removeClass("introjs-disabled");
            }
        }
    }


    // if(!$("#replies").is(":visible")){
    //   console.log($(".introjs-next"))
    //     $('.introjs-nextbutton').addClass('introjs-disabled');
    //     launchToastNotifcation("Please click on a comment first")
    // }
}
