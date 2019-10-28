createUserSelectScreen = async ({ users = users } = {}) => {
    $(".workSelectMenu").hide();
    user_list = users.creator_list;
    for (i in user_list) {
        var user = createUserMenuOption(user_list[i], users);
        $(".usersMenu").append(user);
    }
    //activate the search bar
    $(".searchUser").on("keyup", () => {
        let ul = $(".usersMenu");
        let input = $(".searchUser");
        searchAction(input, ul, "user");
    });
    //make the white list
    console.log(user_list)
    makeWhiteListSettingBase(user_list);
}

function createUserMenuOption(commenterId) {
    if ($(".usersMenuOptions" + "[commenterId = '" + commenterId + "']").length == 0) {
        var user = $("<li/>", {
            class: 'mdl-list__item usersMenuOptions',
            commenterId: commenterId,
            text: commenterId,
            click: function (evt) {
                $(".usersMenuOptions").removeClass("usersMenuSelected");
                $(this).addClass("usersMenuSelected");
                let selected_eppn = evt["currentTarget"]["attributes"]["commenterid"]["value"];
                showUsersLit(selected_eppn);
            }
        });
        return user;
    }
    return undefined;
}

function showUsersLit(selected_eppn) {
    $(".worksMenu").empty();
    $(".workSelectMenu").fadeIn();
    $("#selectedUserWorks").text(selected_eppn + "'s works:");
    let createWorkMenuOptions = true;
    getUserWorks(selected_eppn);
    $(".searchLit").on("keyup", () => {
        let ul = $(".worksMenu");
        let input = $(".searchLit");
        searchAction(input, ul, "work");
    });
}

function getUserWorks(selected_eppn) {
    let endpoint = "get_works";
    API.request({
        endpoint: endpoint,
        method: "GET",
        data: {
            eppn: selected_eppn
        }
    }).then((data) => {
        for (var work in data) {
            var fileName = data[work].substr(0, data[work].lastIndexOf('.')) || data[work];
            var litButton = $("<li/>", {
                class: "mdl-list__item worksMenuOptions",
                id: fileName,
                text: fileName,
                click: function (evt) {
                    if ($(this).attr("disabled") == undefined) {
                        $(".worksMenuOptions").attr("disabled", "disabled");
                        setTimeout(function () {
                            $(".worksMenuOptions").removeAttr("disabled")
                        }, 500);
                        $(".worksMenuOptions").removeClass("workMenuSelected");
                        $(this).addClass("workMenuSelected");
                        let selectedWorkId = $(this).attr("id")
                        selectLit(selected_eppn, selectedWorkId);
                    }
                }
            });
            $(".worksMenu").append(litButton);
        }
    });
}


function selectLit(selected_eppn, textChosen) {
    console.log("called selectLit with", selected_eppn, textChosen);
    $("#text").empty();
    $(".chosenUser").text(selected_eppn + ":");
    $(".chosenFile").text(textChosen);
    let endpoint = 'get_work';
    $.address.value(endpoint + "/" + selected_eppn + "/" + textChosen);
    API.request({
        endpoint: endpoint,
        data: {
            eppn: selected_eppn,
            work: textChosen,
        },
    }).then(data => {
        if (data["status"] != "error") {
            console.log("hihihihihi ")
            let literatureText = data;
            buildHTMLFile(literatureText, selected_eppn, textChosen);
            updateSettingPage(selected_eppn, textChosen);
        } else {
            //if work doesn't exist redirect to home
            $("#home").click();
            launchToastNotifcation("work don't exist");
        }
    });
    //auto scroll to the text part
    window.scrollTo(0, $("#cardbox").position().top + $("#cardbox").height());
    //check the permission for approving comments
    checkworkAdminList(selected_eppn, textChosen, "approvedComments");
}