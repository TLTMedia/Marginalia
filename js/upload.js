function renderUpload() {
    $("#addLitBase").show();
    $("#nonTitleContent").hide();
    var add_Title = $("<span/>", {
    id: "fileSystemTitle",
    text: "File Input System"
    });
    var nameContainer = $("<div/>", {
    class: "nameContainer"
    });
    var add_NameLabel = $("<span/>", {
    text: "Name of Text: "
    });

    // Get the file Name
    var nameDiv = $("<div/>", {
    class: "mdl-textfield mdl-js-textfield"
    });
    var add_NameInput = $("<input/>", {
    class: "mdl-textfield__input",
    type: "text",
    id: "add_nameInput",
    });
    var add_NameInputLabel = $("<label/>", {
    id: "add_nameInput",
    class: "mdl-textfield__label",
    for: "add_nameInput",
    });


    nameDiv.append(add_NameInput, add_NameInputLabel);
    nameContainer.append(add_NameLabel, nameDiv);

    // Add the file
    var fileContainer = $("<div/>", {
    class: "fileContainer"
    });
    var add_FileTitle = $("<span/>", {
    id: "fileTitle",
    text: "Choose Your File: "
    });

    var add_FileButton = $("<label/>", {
    class: "input-custom-file mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored",
    id: "addFileButton",
    text: "Choose"
    });
    var add_FileInput = $("<input/>", {
    type: "file",
    accept: ".docx"
    });
    var add_FileLabel = $("<span/>", {
    id: "fileName",
    text: "*.docx"
    });

    add_FileButton.append(add_FileInput);
    fileContainer.append(add_FileTitle, "<br>", add_FileButton, add_FileLabel);

    // Add Private selector button
    var privateContainer = $("<div/>", {
    class: "privateContainer"
    });
    var add_PrivateCheck = $("<label/>", {
    class: "mdl-checkbox mdl-js-checkbox",
    for: "privateChk",
    id:"privateCheck"
    })
    var add_PrivateInput = $("<input/>", {
    type: "checkbox",
    class: "mdl-checkbox__input mdl-js-ripple-effect",
    id: "privateChk"
    });
    var add_PrivateSpan = $("<span/>", {
    class: "mdl-checkbox__label",
    text: "Private Page?"
    });

    // Upload button
    var add_UploadButton = $("<label/>", {
    class: "mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored",
    id: "addUploadButton",
    text: "Upload"
    });

    var format = ;

    add_PrivateCheck.append(add_PrivateInput, add_PrivateSpan);
    privateContainer.append(add_PrivateCheck);

    $("#addLitBase").append(add_Title, nameContainer, fileContainer, privateContainer,add_UploadButton);

    componentHandler.upgradeElement($(nameDiv)[0]);
    componentHandler.upgradeElement($(add_PrivateCheck)[0]);
    componentHandler.upgradeElement($(add_FileButton)[0]);
    componentHandler.upgradeElement($(add_UploadButton)[0]);


}
