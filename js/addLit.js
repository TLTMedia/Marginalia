function showAddLitPage() {
    $("#settingBase").hide();
    $(".workSelectMenu").hide();
    $("#addLitBase").load("parts/upload.htm", function () {
        $(this).fadeIn();
        $("#nonTitleContent").hide();
        $("#addLitSecondPage").hide();
        $("#doneAddLit").hide();
        /* Makes the checkbox button ('page is private') clickable ... */
        componentHandler.upgradeElement($("#privateCheck")[0]);

        goBackButtonAction();
        doneAddLitButtonAction();
        addFileAndUpload();
    });
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
        console.log(tmpFileToSave);
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
        $("#addNameInput").val(fileName.substr(0, fileName.lastIndexOf('.')) || fileName);
    });

    $("#addUploadButton").on("click", function () {
        var name = $("#addNameInput").val();
        if (name == "" || name.length > 100) {
            launchToastNotifcation("Please choose a file name no longer than 100 characters");
        }
        else if (/^[\s]+$/.test(name)) {
            launchToastNotifcation("Please chosse a file name without space");
        }
        else if (!/^[a-zA-Z0-9_\-\.]+$/.test(name)) {
            launchToastNotifcation("Please choose a file name without special characters");
        } else {
            saveLit({ work: name, privacy: $("#privateCheck").is('.is-checked'), data: fileToSave });
        }
    });
}
