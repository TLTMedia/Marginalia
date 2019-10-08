//TODO clean this function
$(window).ready(function () {
  $("#litadd").on("click", function (evt) {
    $(".headerTab").removeClass("active");
    $("#litadd").addClass("active");
    showAddLitPage();
    resetWhiteListPage();
  });

  $("#setting").addClass("disabledHeaderTab");
  $("#setting").off().on("click", () => {
    let author = $("#setting").attr("author");
    let work = $("#setting").attr("work");
    if ($("#setting").hasClass("disabledHeaderTab")) {
      launchToastNotifcation("Please select a work first");
    }
    //if user is not the author they don't have the ability to change the setting
    else if (!isCurrentUserSelectedUser(author)) {
      launchToastNotifcation("You don't have the permission to do this action");
    }
    else {
      $(".headerTab").removeClass("active");
      $("#setting").addClass("active");
      litSettingButtonOnClick(work, author);
    }
  });

  $("#home").off().on("click", function () {
    $(".headerTab").removeClass("active");
    $(this).addClass("active");
    homeButtonAction();
    resetWhiteListPage();
    $(".selectorOpener").remove();
  });


});

function saveLit({ work, privacy, data } = {}) {
  if (data.size > 2000000) {
    alert("Error: File too large. Can't be larger than 2Mb.");
    return;
  }
  const formData = new FormData();
  formData.append("file", data);
  formData.append("work", work);
  formData.append("privacy", privacy);



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


function showLink(value) {
  $.address.value(value);
}

function loadFromDeepLink() {
  if (location.hash) {
    [, api, ...rest] = location.hash.split("#")[1].split("/");
    if (api == "get_work") {
      selectLit(...rest)
    }
  }
  else {
    homeButtonAction();
  }
}

function homeButtonAction() {
  //TODO try get rid of the extra pound
  showLink("");
  $("#text , .userFiles, #settingBase, #addLitBase").hide();
  $("#nonTitleContent").show();
  $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
  //disable the setting header tab
  $("#setting").addClass("disabledHeaderTab");
  $(".headerTab").removeClass("active");
  $("#home").addClass("active");
  //TODO this is the old hide box with wierd query
  hideAllBoxes();
  //hideReplyBox();
  //hideCommentBox();
}
//----------------------------------------------------------

createUserSelectScreen = async ({ users = users } = {}) => {
  $(".workSelectMenu").hide();
  user_list = users.creator_list;
  // TODO need to check what does this width thing do
  // figure out why this is here

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
          $(".worksMenuOptions").removeClass("workMenuSelected");
          $(this).addClass("workMenuSelected");
          let selectedWorkId = evt["currentTarget"]["id"];
          selectLit(selected_eppn, selectedWorkId);
        }
      });
      $(".worksMenu").append(litButton);
    }
  });
}

function selectLit(selected_eppn, textChosen) {
  $("#text").empty();
  $(".chosenUser").text(selected_eppn + ":");
  $(".chosenFile").text(textChosen);
  let endpoint = 'get_work'
  showLink(endpoint + "/" + selected_eppn + "/" + textChosen);
  API.request({
    endpoint: endpoint,
    data: {
      eppn: selected_eppn,
      work: textChosen,
    },
  }).then(data => {
    if (data["status"] != "error") {
      let literatureText = data;
      buildHTMLFile(literatureText, selected_eppn, textChosen);
      updateSettingPage(selected_eppn, textChosen);
    }
    else {
      //if work doesn't exist redirect to home
      $("#home").click();
      launchToastNotifcation("");
    }
  });
  //auto scroll to the text part
  window.scrollTo(0, $("#cardbox").position().top + $("#cardbox").height());
  //check the permission for approving comments
  checkworkAdminList(selected_eppn, textChosen, "approvedComments");
}

function updateSettingPage(selected_eppn, textChosen) {
  let endPoint = "comments_need_approval/" + selected_eppn + "/" + textChosen; // unused?
  $("#setting").removeClass("disabledHeaderTab");
  $("#setting").attr({
    "author": selected_eppn,
    "work": textChosen
  });
  $("#settingBase").hide();
}