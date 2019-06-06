$(window).ready(function() {

    $("#litadd").on("click", function(evt) {
        $("#settingBase").hide();
        $("#addLitBase").load("parts/upload.htm", function() {
            $(this).fadeIn();
            $("#nonTitleContent").hide();
            /* Makes the checkbox button ('page is private') clickable ... */
            componentHandler.upgradeElement($("#privateCheck")[0]);
            $("#goBack").on("click", function() {
                if ($("#addLitBase").is(":visible")) {
                    $("#addLitBase").hide();
                    $("#nonTitleContent").show();
                }
            });
            var fileToSave;
            $("#addFileButton").on("change", function(e) {
                fileToSave = e.target.files[0];
                if (fileToSave === undefined || fileToSave === null) {
                    // Can occur when user cancels file-choosing view
                    return;
                }

                var fileName = fileToSave.name;
                if (fileName.length > 100) {
                    alert("File name can't exceed 100 characters");
                    return;
                }

                $("#fileName").text(fileName);
                $(".tempNameContainer").hide();
                $(".nameContainer").show();
                $("#addNameInput").val(fileName.substr(0, fileName.lastIndexOf('.')) || fileName);
            });

            $("#addUploadButton").on("click", function() {
                var name = $("#addNameInput").val();
                if (name == "" || name.length > 100) {
                    alert("Please choose a file name no longer than 100 characters");
                } else if (!/^[a-zA-Z0-9_\-\s\.\%\(\)]+$/.test(name)) {
                    alert("Please choose a file name with no special characters");
                } else {
                    saveLit({work: name, privacy: $("#privateCheck").is('.is-checked'), data: fileToSave});
                }
            });
        });
    });

    $("#setting").off().on("click",function(evt){
      settingButtonAction(evt);
    });
});

saveLit = ({work, privacy, data} = {}) => {
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
    callback: launchToastNotifcation
  });
}

function settingButtonAction(evt){
  $("#addLitBase").hide();
  $("#settingBase").fadeIn();
  $(".settingLitDiv").hide();
  $(this).fadeIn();
  $("#nonTitleContent").hide();
  $("#settingGoBack").children().on("click", function() {
      if ($("#settingBase").is(":visible")) {
          $("#settingBase").hide();
          $("#nonTitleContent").show();
      }
  });
}

createSettingScreen = async ({users = users} = {}) =>{
  $("#settingBase").hide();
  user_list = users.creator_list;
  for(i in user_list){
    console.log(user_list[i]);
    var user = $("<li/>",{
      text:user_list[i],
      class:'settingUsers',
      id:user_list[i],
      click: function(evt){
        showUsersLit(users,evt["currentTarget"]["id"]);
      }
    });
    $(".users").append(user);
  }
}

function showUsersLit(users,selected_eppn){
  $(".settingLitTitle").html(selected_eppn+"'s Literatures:");
  $(".settingLitDiv").show();
  $(".literatures").empty();
  users.get_user_works(selected_eppn).then((works) => {
      for (var lit in works) {
        var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
        var litButton = $('<li/>', {
          class: "settingLit",
          id: "s"+works[lit],
          text: fileWithoutExt,
          click: function(evt){
            litOnClick(evt);
          }
        });
        $(".literatures").append(litButton);
      }
  });
}

function litOnClick(evt){
  $(".settingLit").removeClass("settingLitSelected");
  $("#settingButtons").remove();
  console.log(evt);
  var selectedLitId = evt["currentTarget"]["id"];
  var escapedLitId = escapeSpecialChar(selectedLitId);
  $("#"+escapedLitId).addClass("settingLitSelected");
  var deleteLitButton = $('<button/>',{
    class:"litDelButton",
    text: "Delete",
    click: (evt)=>{
      console.log("delete");
      litDelButtonOnClick(evt,selectedLitId);
    }
  });
  var editLitButton = $('<button/>',{
    class:"litEditButton",
    text: "Edit",
    click: (evt)=>{
      console.log("edit");
      litEditButtonOnClick(evt,selectedLitId);
    }
  })
  var settingButtons = $('<span/>',{
    id:"settingButtons"
  });
  $(".literatures").append(settingButtons);
  $("#settingButtons").append(editLitButton,deleteLitButton);
}

function litDelButtonOnClick(evt,selectedLitId){
  //TODO backEndAPI
  //get the acctual name of the literature bcus the id pass in is (s + lit Name)
  var litId = selectedLitId.slice(1,selectedLitId.length);
  console.log("delete ",litId);
}

function litEditButtonOnClick(evt,selectedLitId){
  var litId = selectedLitId.slice(1,selectedLitId.length);
  console.log("edit ",litId)
}

createUserSelectScreen = async ({users = users} = {}) => {
  user_list = users.creator_list;
  width = $(document).width();
  var userWorks = [];
  var selector = $("#userSelector");
  var usersItems = $("<ul/>", {
    id: "usersItems",
    class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
    for: "pickUser"
  });

  selector.append(usersItems);

  var length = user_list.length;
  var rows = 0;
  while (length >= 1) {
    length -= 3;
    rows++;
  }

  for (let userNum in user_list) {
    let userItem = $("<li/>", {
      text: user_list[userNum],
      class: "mdl-menu__item userButton"
    });

    usersItems.append(userItem);
  }

  $(".userButton").click(function() {
      $(".userFiles").show();
      let selected_eppn = $(this).text();
      $(".chosenUser").text(selected_eppn + ":");
      $(".chosenFile").text("");
      $("#worksButtons").remove();
      createLitSelectorScreen({users: users, selected_eppn: selected_eppn});
  });

  componentHandler.upgradeElement($('#usersItems')[0]);

  $(".userFiles").hide();
}

/**
 * Temporary pass the api object to 'everything'...
 * So that any ~global~ function can make an api call...
 */
 createLitSelectorScreen = ({users = users, selected_eppn = selected_eppn} = {}) => {
   var selector = $(".userFiles");
   var worksButtons = $("<ul/>", {
     id: "worksButtons",
     class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
     for: "pickLit"
   });
   selector.append(worksButtons);

   users.get_user_works(selected_eppn).then((works) => {
       for (var lit in works) {
         var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
         var litButton = $('<li/>', {
           class: "mdl-menu__item",
           id: works[lit],
           text: fileWithoutExt,
           click: function(evt) {
             hideAllBoxes();
             $(".nameMenu").remove();
             textChosen = evt['currentTarget']['id'];
             selectLit(textChosen);
           }
         });

         worksButtons.append(litButton);
       }

       componentHandler.upgradeElement($('#worksButtons')[0]);
   });
 }

 function selectLit(textChosen){
   $("#text").empty();
   $(".chosenFile").text(textChosen);
   userChosen = $(".chosenUser").html().split(":")[0];
   let endpoint = 'get_work/' + userChosen + '/' + textChosen;
   API.request({endpoint}).then((data) => {
       literatureText = data;
       buildHTMLFile(data, "mdl-menu__item");
   });
 }
