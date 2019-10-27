function updateSettingPage(selected_eppn, textChosen, course) {
    if(course == undefined){
        $("#setting").removeClass("disabledHeaderTab");
        $("#setting").attr({
            "author": selected_eppn,
            "work": textChosen
        });
    }
    else{
        $("#setting").attr("course",course)
    }
    $("#settingBase").hide();
}

function resetWhiteListSearch() {
    $(".searchWhiteList").val("");
    searchAction($(".searchWhiteList"), $(".whiteList"), "user");
}

function resetWhiteListPage(){
    $(".whiteListSettingBase").empty();
}

// function resetWhiteListPage() {
//     enableAllWhiteListOption();
//     let whiteList = $(".whiteListCheckBox");
//     for (var i = 0; i < whiteList.length; i++) {
//         console.log(whiteList[i]["attributes"]["id"]["value"]);
//         let id = whiteList[i]["attributes"]["id"]["value"];
//         //checkbox is still checked
//         if ($("#" + escapeSpecialChar(id)).parent("label").hasClass("is-checked")) {
//             console.log("uncheck");
//             $("#" + escapeSpecialChar(id)).off().click();
//         }
//     }
// }

function settingGoBackButtonOnClick() {
    if ($("#settingBase").is(":visible")) {
        if ($(".litSettingBase").is(":visible")) {
            $("#setting").removeClass("active");
            $("#settingBase").hide();
            $("#nonTitleContent").show();
        }
        else if ($(".whiteListSettingBase").is(":visible")) {
            $(".whiteListSettingBase").hide();
            resetWhiteListSearch();
            resetWhiteListPage();
            $(".litSettingBase").show();
        }
        else if ($(".settingDataBase").is(":visible")) {
            $(".settingDataBase").hide();
            $(".litSettingBase").show();
            adjustCardBoxSize(undefined);
        }
    }
}

// mode will be user / work
function searchAction(input, ul, mode) {
    searchKey = input.val();
    list = ul.find("li");
    if (mode == "user") {
        searchUser(list, searchKey);
    }
    else if (mode == "work") {
        searchWork(list, searchKey);
    }
}

function searchUser(list, searchKey) {
    list.each((index, element) => {
        let commenterId = $(element).attr("commenterId");
        let skip = false;
        if (commenterId == undefined) {
            if ($(element).hasClass("selectorHeader") || $(element).find("input").attr("id") == "AllCommenters") {
                skip = true;
            }
            else {
                commenterId = $(element).find("input").attr("id");
            }
        }
        if (!skip) {
            if (commenterId.toUpperCase().indexOf(searchKey.toUpperCase()) > -1) {
                $(element).show();
            }
            else {
                $(element).hide();
            }
        }
    });
}

function searchWork(list, searchKey) {
    list.each((index, element) => {
        let workId = $(element).attr("id");
        if (workId.toUpperCase().indexOf(searchKey.toUpperCase()) > -1) {
            $(element).show();
        }
        else {
            $(element).hide();
        }
    });
}

function makeWhiteListSettingBase(user_list) {
    var whiteList = $("<ul/>", {
        class: "mdl-list whiteList"
    });
    let whiteListTitle = $("<h6/>", {
        class: "whiteListTitle",
        text: "Click on the check box to add the user to the white list"
    });
    let whiteListSearch = $("<input/>", {
        class: "searchWhiteList",
        placeholder: "Search for users..",
        keyup: () => {
            let ul = $(".whiteList");
            let input = $(".searchWhiteList");
            searchAction(input, ul, "user");
        }
    });
    for (i in user_list) {
        let user = $("<li/>", {
            text: user_list[i]["firstName"] + " " + user_list[i]["lastName"],
            class: 'mdl-list__item whiteListOption',
            commenterId: user_list[i]["eppn"]
        });
        let span = $("<span/>", {
            class: "mdl-list__item-secondary-action whiteListCheckBoxSpan"
        });
        let label = $("<label/>", {
            class: "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect",
            for: "wl_" + user_list[i]["eppn"]
        });
        let input = $("<input/>", {
            class: "mdl-checkbox__input whiteListCheckBox",
            type: "checkbox",
            id: "wl_" + user_list[i]["eppn"]
        });
        $(label).append(input);
        $(span).append(label);
        $(user).append(span);
        $(whiteList).append(user);
    }
    $(".whiteListSettingBase").append(whiteListTitle, whiteListSearch, whiteList);
    componentHandler.upgradeAllRegistered();
}


function checkIsWorkPublic(selected_eppn, litId) {
    API.request({
        endpoint: "is_public",
        method: "GET",
        data: {
            creator: selected_eppn,
            work: litId,
        }
    }).then((data) => {
        console.log("isPublic", data);
        if (data == "false") {
            $("#privacySwitch").addClass("disabled").click();
            $("#privacySwitch").removeClass("disabled");
        }
    });
}

function checkIsCommentNeedApproval(selected_eppn, litId) {
    console.log("is_comments_require_approval/" + selected_eppn + "/" + litId);
    API.request({
        endpoint: "is_comments_require_approval",
        data: {
            creator: selected_eppn,
            work: litId,
        },
        method: "GET",
    }).then((data) => {
        console.log("need approval ", data);
        if (data == "true") {
            $("#commentsNeedApprovalSwitch").addClass("disabled").click();
            $("#commentsNeedApprovalSwitch").removeClass("disabled");
        }
    });
}

function litSettingButtonOnClick(course, selectedLitId, selected_eppn) {
    $("#nonTitleContent , #addLitBase").hide();
    $("#settingBase").show();
    $(".whiteListSettingBase, .settingDataBase").hide();
    $(".litSettingBase").empty().fadeIn();
    $("#settingTitle").text("Settings For : " + $("#setting").attr("course") + " " + selected_eppn + "'s " + selectedLitId);
    let settingOptions = $("<div/>", {
        class: "settingOptions"
    });
    $(".litSettingBase").append(settingOptions);
    //privacy Switch
    makeSettingSwitch("privacy", "Work is Private?", selectedLitId, selected_eppn, checkIsWorkPublic);
    //commentNeedApproval switch
    makeSettingSwitch("commentsNeedApproval", "Comments Require Approval?", selectedLitId, selected_eppn, checkIsCommentNeedApproval);

    // whiteListPageOpener
    makeSettingButton(course, selectedLitId, selected_eppn, "litWhiteListButton", "Manage White List");
    makeSettingButton(course, selectedLitId, selected_eppn, "settingDataButton", "Work's Data");
    makeSettingButton(course, selectedLitId, selected_eppn, "deleteWorkButton", "Delete Work");
    //activate the go back button
    $("#settingGoBack").children().off().on("click", () => {
        settingGoBackButtonOnClick();
    });
    addTutorialClass();
}

function addTutorialClass(){
    //settingTutorial
    let privacySwitch = $(".settingSwitch"+"[for = 'privacySwitch']").addClass("privacySwitch");
    privacySwitch.attr({
        "data-hint": "Toggle the switch to set the work's privacy"
    });
}

// purpose : privacy / commentsNeedApproval
// return the input element and the event will be handle out side this function
function makeSettingSwitch(purpose, text, litId, selected_eppn, callback) {
    // let option = $("<div/>");
    let span = $("<span/>", {
        class: "mdl-switch__label",
        text: text
    });

    let label = $("<label/>", {
        class: "mdl-switch mdl-js-switch settingSwitch",
        for: purpose + "Switch"
    });

    let input = $("<input/>", {
        type: "checkbox",
        id: purpose + "Switch",
        class: "mdl-switch__input"
    });

    $(".settingOptions").append(label)
    $(label).append(span, input);
    componentHandler.upgradeAllRegistered();

    if (callback != undefined) {
        callback(selected_eppn, litId);
    }

    input.off().on("change", evt => {
        if (!input.hasClass("disabled")) {
            workSettingSwitchOnChange(evt, litId, selected_eppn);
        }
    });
}

function makeSettingButton(course, litId, selected_eppn, buttonName, buttonText) {
    let button = $("<div/>", {
        class: buttonName,
        text: buttonText
    });
    if (buttonName == "litWhiteListButton") {
        button.on("click", (evt) => {
            //console.log("white list!");
            if (isCurrentUserSelectedUser(selected_eppn, true)) {
                $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
                $(this).addClass("litSettingOptionSelected");
                showWhiteListSettingBase(course, litId, selected_eppn,updateWhiteListBase);
            }
        });
        $(button).append(`<i class="material-icons whiteListLinkIcon">link</i>`);
        componentHandler.upgradeAllRegistered();
    }
    else if (buttonName == "deleteWorkButton") {
        button.on("click", (evt) => {
            if (isCurrentUserSelectedUser(selected_eppn, true)) {
                if (confirm("Are you sure you want to delete the work " + litId + "?")) {
                    deleteWork(litId, selected_eppn, undefined);
                }
            }
        })
    }
    else if (buttonName == "settingDataButton") {
        button.on("click", (evt) => {
            showWorkSettingDataBase(selected_eppn, litId);
        })
    }
    $(".settingOptions").append(button);
}

//TODO php for commentsNeedApproval
function workSettingSwitchOnChange(evt, litId, selected_eppn) {
    let currentTarget = evt["currentTarget"]["id"];
    let endPoint, message;
    let isSelected;
    let data = {};
    if (currentTarget == "privacySwitch") {
        isSelected = $("#privacySwitch").is(":checked");
        if (isSelected) {
            endPoint = "set_privacy";
            data.creator = selected_eppn;
            data.work = litId;
            data.privacy = false;
            message = "current work is set to private";
        } else {
            endPoint = "set_privacy";
            data.creator = selected_eppn;
            data.work = litId;
            data.privacy = true;
            message = "current work is set to public";
        }
    }
    else {
        isSelected = $("#commentsNeedApprovalSwitch").is(":checked");
        if (isSelected) {
            message = "comments need approval for current work";
            endPoint = "set_require_approval";
            data.creator = selected_eppn;
            data.work = litId;
            data.approval = true;
        }
        else {
            message = "comments don't need approval for current work";
            endPoint = "set_require_approval";
            data.creator = selected_eppn;
            data.work = litId;
            data.approval = false;
        }
    }
    API.request({
        endpoint: endPoint,
        method: "POST",
        data: data
    }).then(data => {
        launchToastNotifcation(message);
    });
}

function deleteWork(litId, selected_eppn, userWorkCount) {
    if (userWorkCount == undefined) {
        console.log("0")
        API.request({
            endpoint: "get_works",
            method: "GET",
            data: {
                eppn: selected_eppn
            }
        }).then((data) => {
            let i = data.length
            console.log(i)
            deleteWork(litId, selected_eppn, i);
        });
    }
    else {
        console.log("2")
        API.request({
            endpoint: "delete_work",
            method: "POST",
            data: {
                work: litId,
                creator: selected_eppn
            }
        }).then((data) => {
            $("#home").click();
            // user only have one work before we delete the current work => delete the userMenuOptions
            if (userWorkCount == 1) {
                $(".usersMenuOptions" + "[commenterId = '" + selected_eppn + "']").remove();
                $(".workSelectMenu").hide();
            }
            launchToastNotifcation(data);
        });
    }
}

function adjustCardBoxSize(target) {
    //reset
    if (target == undefined) {
        $(".introBoxes").css({
            "width": "",
            "max-width": ""
        });
    }
    else {
        let targetWidth = $("." + target).width();
        targetWidth += 100;
        $(".introBoxes").css({
            "width": targetWidth,
            "max-width": targetWidth
        });
    }
}

function showWorkSettingDataBase(selected_eppn, litId) {
    $(".litSettingBase").hide();
    $(".settingDataBase").show();
    let tbody = $(".settingDataTable").find("tbody");
    tbody.empty();
    let isHeadCreated = $(".settingDataTable").find("thead").children().length;
    console.log(isHeadCreated);
    if (isHeadCreated) {
        createDataTableBody(selected_eppn, litId);
    }
    else {
        createDataTableHeader();
        createDataTableBody(selected_eppn, litId);
    }
    adjustCardBoxSize("settingDataTable");
}

function createDataTableHeader() {
    let thead_tr = $("<tr/>");
    let nameTableHead = $("<th/>", {
        class: "mdl-data-table__cell--non-numeric",
        text: "Name/Type"
    });
    thead_tr.append(nameTableHead);
    let dataTableHead = ["All Comments", "Unapproved Comments"];
    for (var i in dataTableHead) {
        let header = $("<th/>", {
            text: dataTableHead[i]
        });
        thead_tr.append(header);
    }
    $(".settingDataTable").find("thead").append(thead_tr);
    componentHandler.upgradeAllRegistered();
}

function createDataTableBody(selected_eppn, litId) {
    let typeData = ["All", "Historical", "Analytical", "Comment", "Question"];
    for (var i in typeData) {
        let tr = $("<tr/>");
        let data = [getWorkCommentsData(typeData[i], undefined, true), getWorkCommentsData(typeData[i], undefined, false)]
        let type = $("<td/>", {
            class: "mdl-data-table__cell--non-numeric",
            text: typeData[i]
        });
        tr.append(type);
        for (var j in data) {
            let num = $("<td/>");
            num.html(data[j]);
            tr.append(num)
        }
        $(".settingDataTable").find("tbody").append(tr);
    }
    API.request({
        endpoint: "get_highlights",
        method: "GET",
        data: {
            creator: selected_eppn,
            work: litId
        }
    }).then((data) => {
        let commenter = createListOfCommenter(data);
        for (var i in commenter) {
            let tr = $("<tr/>");
            let name = $("<td/>", {
                class: "mdl-data-table__cell--non-numeric",
                text: commenter[i]
            });
            tr.append(name);
            let data = [getWorkCommentsData(undefined, commenter[i], true), getWorkCommentsData(undefined, commenter[i], false)];
            for (var j in data) {
                let num = $("<td/>");
                num.html(data[j]);
                tr.append(num);
            }
            $(".settingDataTable").find("tbody").append(tr);
        }
    });
    componentHandler.upgradeAllRegistered();
}

function getWorkCommentsData(type, commenter, all) {
    let className;
    let data;
    if (all) {
        className = ".commented-selection"
    }
    else {
        className = ".unapprovedComments"
    }
    if (type != undefined) {
        if (type == "All") {
            data = $(className);
        }
        else {
            data = $(className + "[typeOf = '" + type + "']");
        }
    }
    else if (commenter != undefined) {
        data = $(className + "[creator = '" + commenter + "']");
    }
    return data.length
}

//litId = literature name , selected_eppn = creator of the literature
function showWhiteListSettingBase(course, litId, selected_eppn, callback) {
    enableAllWhiteListOption();
    $(".whiteListSettingBase").fadeIn();
    $(".litSettingBase").hide();
    $(".whiteListCheckBoxSpan").children("label").removeClass("is-checked");
    API.request({
        endpoint: "get_creators_of_course",
        method: "GET",
        data: {
          course: course
        }
    }).then((users)=>{
        console.log(users);
        makeWhiteListSettingBase(users);
    });
    callback(litId, selected_eppn);
}

function updateWhiteListBase(litId, selected_eppn){
    let endPoint = "get_permissions_list";
    console.log(endPoint)
    API.request({
        endpoint: endPoint,
        method: "GET",
        data: {
            eppn: selected_eppn,
            work: litId,
        }
    }).then((data) => {
        for (var i = 0; i < data["admins"].length; i++) {
            let whiteListUser = data["admins"][i];
            let inputs = $(".whiteList").find("input");
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j]["id"].split("_")[1] == whiteListUser) {
                    $("#" + escapeSpecialChar(inputs[j]["id"])).off().click();
                    console.log(inputs[j]["id"]);
                }
            }
        }
        disableCreatorWhiteListOption(litId, selected_eppn);
        $(".whiteListCheckBox").off().on("change", (evt) => {
            addUserToWhiteList(evt["currentTarget"]["id"], litId);
            console.log("clicked");
        });
    });
}

function enableAllWhiteListOption() {
    $(".whiteListCheckBox").removeAttr("disabled");
}

//litId = literature name, selected_eppn = creator of the work
function disableCreatorWhiteListOption(litId, selected_eppn) {
    let inputId = "wl_" + selected_eppn;
    $("#" + escapeSpecialChar(inputId)).attr("disabled", true);
}

function addUserToWhiteList(selected_eppn, litId) {
    let eppn = selected_eppn.split("_")[1];
    let endPoint;
    let data = {};
    if ($("#" + escapeSpecialChar(selected_eppn)).is(":checked")) {
        endPoint = "add_permission";
        data.work = litId;
        data.eppn = eppn;
        //TODO notification is not well enough
        launchToastNotifcation(eppn + " is added to the white list");
    }
    else {
        endPoint = "remove_permission";
        data.work = litId;
        data.eppn = eppn;
        //TODO notification is not well enough
        launchToastNotifcation(eppn + " is removed from the white list");
    }
    API.request({
        endpoint: endPoint,
        method: "POST",
        data: data,
    }).then(data => {
        console.log(data);
        console.log(endPoint);
    });
}
