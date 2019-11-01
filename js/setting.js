// function updateSettingPage(selected_eppn, textChosen, course) {
//     if (course == undefined) {
//         $("#setting").removeClass("disabledHeaderTab");
//         $("#setting").attr({
//             "author": selected_eppn,
//             "work": textChosen
//         });
//     }
//     else {
//         $("#setting").attr("course", course)
//     }
//     // $("#settingBase").hide();
// }

function disableSettingPage() {
    $("#setting").addClass("disabledHeaderTab")
    $("#setting").removeAttr("author work course");
}

function resetWhiteListSearch() {
    $(".searchWhiteList").val("");
    searchAction($(".searchWhiteList"), $(".whiteList"), "user");
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

function addTutorialClass() {
    //settingTutorial
    let privacySwitch = $(".settingSwitch" + "[for = 'privacySwitch']").addClass("privacySwitch");
    privacySwitch.attr({
        "data-hint": "Toggle the switch to set the work's privacy"
    });
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

    $("#settingDataTable").find("thead").append(thead_tr);

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
        $("#settingDataTable").find("tbody").append(tr);
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
            $("#settingDataTable").find("tbody").append(tr);
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
