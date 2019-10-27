function showAddLitPage() {
    $("#settingBase").hide();
    $(".workSelectMenu").hide();
    $("#addLitBase").load("parts/upload.htm", function () {
        $(this).fadeIn();
        $("#nonTitleContent").hide();
        $("#addLitSecondPage").hide();
        $("#doneAddLit").hide();
        /* Makes the checkbox button ('page is private') clickable ... */
        API.request({
            endpoint: "courses",
            method: "GET"
        }).then((data) => {
            makeAddLitCourseOptions(data)
        });
        //TutorialButton
        $("#helpForAddLit").off().on("click", () => {
            var tutorialData = [
                 [".fileContainer", 1,"Select a file from your device"],
                 [".nameContainer", 2, "Name your work"],
                 [".addLitCourseMenu", 3, "Select a course that you want to upload your work for"],
                 [".privateContainer", 4,"Check the box if you want your work to be private. (you are able to change your work's privacy after you upload it)"],
                 ["#addUploadButton", 5, "Click to upload"]
            ];
            var specialStepData = {};
            makeTutorial(tutorialData);
            startTutorial(tutorialData,specialStepData);
        });
        componentHandler.upgradeAllRegistered();

        goBackButtonAction();
        doneAddLitButtonAction();
        addFileAndUpload();
    });
}

function makeAddLitCourseOptions(data) {
    courseList = $(".courseListForAddLit");
    for (var course in data) {
        var option = $("<li/>", {
            class: "mdl-menu__item courseOptionForAddLit",
            text: data[course],
            click: (evt) => {
                $("#addLitSelectedCourse").empty().text("Current selected course: " + evt["currentTarget"]["textContent"]);
            }
        });
        courseList.append(option);
    }
    componentHandler.upgradeAllRegistered();
}

function goBackButtonAction() {
    $("#goBack").on("click", function () {
        if ($("#addLitSecondPage").is(":visible")) {
            $("#addLitSecondPage").hide();
            $("#doneAddLit").hide();
            $("#addLitFirstPage").show();
        }
        else if ($("#addLitFirstPage").is(":visible")) {
            $("#litadd").removeClass("active");
            $("#addLitBase").hide();
            $("#nonTitleContent").show();
        }
    });
}

function doneAddLitButtonAction() {
    $("#doneAddLit").on("click", () => {
        $("#litadd").removeClass("active");
        $("#addLitBase").hide();
        $("#nonTitleContent").show();
    });
}

function addFileAndUpload() {
    var fileToSave;
    $("#addFileButton").on("change", function (e) {
        let tmpFileToSave = e.target.files[0];
        if (tmpFileToSave === undefined || tmpFileToSave === null) {
            // Can occur when user cancels file-choosing view
            return;
        } else {
            fileToSave = tmpFileToSave;
        }
        let fileName = fileToSave.name;
        if (fileName.length > 100) {
            alert("File name can't exceed 100 characters");
            return;
        }
        $("#fileName").text(fileName);
        $(".tempNameContainer").hide();
        $(".nameContainer").show();
        if ($("#addNameInput").val().length > 0) {
            // don't do anything because the user already typed in a name and we don't want to overwrite it.
        } else {
            $("#addNameInput").val(fileName.substr(0, fileName.lastIndexOf('.')) || fileName);
        }
    });

    $("#addUploadButton").on("click", function () {
        var name = $("#addNameInput").val();
        var reg = /:\s.+/;
        var x = $("#addLitSelectedCourse").text().match(reg);
        var course = x == null ? undefined : x[0].slice(2);
        console.log(course);
        if (name == "" || name.length > 100) {
            launchToastNotifcation("Please choose a file name no longer than 100 characters");
        }
        else if (/^[\s]+$/.test(name)) {
            launchToastNotifcation("Please chosse a file name without space");
        }
        else if (!/^[a-zA-Z0-9_\-\.\s]+$/.test(name)) {
            launchToastNotifcation("Please choose a file name without special characters");
        }
        else if (course == undefined) {
            launchToastNotifcation("Please select a course before you update your work");
        }
        else {
            saveLit({ work: name, privacy: $("#privateCheck").is('.is-checked'), data: fileToSave, course: course });
        }
    });
}

function saveLit({ work, privacy, data, course } = {}) {
    if (data.size > 2000000) {
        alert("Error: File too large. Can't be larger than 2Mb.");
        return;
    }
    const formData = new FormData();
    formData.append("file", data);
    formData.append("work", work);
    formData.append("privacy", privacy);
    formData.append("course", course);
    API.request({
        endpoint: "create_work",
        method: "POST",
        data: formData,
        dataType: "form",
    }).then(data => {
        launchToastNotifcation(work + " is successfully created");
        $("#addLitSecondPage").show();
        $("#doneAddLit").show();
        $("#addLitFirstPage").hide();
        $(".uploadNotification").html('"<i>' + work + '</i>" is successfully created');
        addNewUser();
    });
}

function addNewUser() {
    API.request({
        endpoint: "get_creators",
        method: "GET"
    }).then((creators) => {
        console.log(creators);
        let isCurrentUserNewCreator = true;
        let count = 0;
        for (var i = 0; i < creators.length; i++) {
            if (creators[i] == currentUser.eppn) {
                count++;
                if (count > 1) {
                    isCurrentUserNewCreator = false;
                }
            }
        }
        if (isCurrentUserNewCreator) {
            console.log("adddddddd")
            let newCreator = createUserMenuOption(currentUser.eppn);
            if (newCreator) {
                $(".usersMenu").append(newCreator);
            }
        }
    });
}
