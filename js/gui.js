$(window).ready(function() {
console.log($.address)
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

    $("#home").off().on("click",function(){
      homeButtonAction();
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

function showLink(value){
  $.address.value(value);
}

function loadFromDeepLink(){
  if(location.hash){
    [,api,...rest]=location.hash.split("#")[1].split("/");
    if(api=="get_work"){
       selectLit(...rest)
    }
  }
  else{
    homeButtonAction();
  }
}

function homeButtonAction(){
  //TODO try get rid of the extra pound
  showLink("");
  $("#text , .userFiles").hide();
  $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
}

function settingButtonAction(evt){
  $("#addLitBase , #nonTitleContent").hide();
  $("#settingBase").fadeIn();
  $(".settingUserDiv , #settingTitle").show();
  $(".settingLitDiv , .litSettingBase").hide();
  $("#settingGoBack").children().on("click",()=>{
    settingGoBackButtonOnClick();
  });
}

function settingGoBackButtonOnClick(){
  if ($("#settingBase").is(":visible")) {
    if($(".litSettingBase").is(":visible")){
      $(".litSettingBase").hide();
      $("#settingTitle , .settingUserDiv, .settingLitDiv").show();
    }
    else{
      $("#settingBase").hide();
      $("#nonTitleContent").show();
    }
  }
}

createSettingScreen = async ({users = users} = {}) =>{
  $("#settingBase").hide();
  user_list = users.creator_list;
  for(i in user_list){
    console.log(user_list[i]);
    var user = $("<li/>",{
      text:user_list[i],
      class:'settingUsers',
      commenterId: user_list[i],
      click: function(evt){
        console.log(evt);
        showUsersLit(users,evt["currentTarget"]["attributes"]["commenterid"]["value"]);
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
            litOnClick(evt, selected_eppn);
          }
        });
        $(".literatures").append(litButton);
      }
  });
}

function litOnClick(evt, selected_eppn){
  $(".settingLit").removeClass("settingLitSelected");
  $("#settingButtons").remove();
  let selectedLitId = evt["currentTarget"]["id"];
  $("#"+escapeSpecialChar(selectedLitId)).addClass("settingLitSelected");

  var litSettingButton = $("<button/>",{
    class: "mdl-button mdl-js-button mdl-button--icon",
    click: (evt)=>{
      litSettingButtonOnClick(evt,selectedLitId, selected_eppn);
    }
  });
  var icon = $("<i/>",{
    class: "material-icons",
    text: "settings"
  });
  var settingButtons = $('<span/>',{
    id:"settingButtons"
  });
  $(".literatures").append(settingButtons);
  $("#settingButtons").append(litSettingButton);
  $(litSettingButton).append(icon);
}

function litSettingButtonOnClick(evt,selectedLitId, selected_eppn){
  $("#settingTitle , .settingUserDiv, .settingLitDiv").hide();
  $(".litSettingBase").show();
  let litId = selectedLitId.slice(1,selectedLitId.length);
  $(".litSettingBaseTitle").text("Settings For : " + selected_eppn +"'s " +litId);
  if($(".settingOptions").length == 0){
    var settingOptions = $("<ul/>",{
      class: "settingOptions mdl-list"
    });
    $(".litSettingBase").append(settingOptions);
    //private
    makeLitPrivacySwitch(litId);
    //edit
    makeLitEditButton(litId);
    //delete
    makeLitDelButton(litId);
  }
  //save
}

function makeLitPrivacySwitch(litId){
  let privacyOption =$("<li/>",{
    class: "mdl-list__item",
    text: "Private"
  });
  var privacySwitch= $("<label/>",{
    class: "mdl-switch mdl-js-switch mdl-js-ripple-effect",
    for: "privacySwitch"
  });
  var input = $("<input/>",{
    type: "checkbox",
    id: "privacySwitch",
    class: "mdl-switch__input"
  });
  $(".settingOptions").append(privacyOption);
  $(privacyOption).append(privacySwitch);
  $(privacySwitch).append(input);
  input.on("click",(evt)=>{
    makeLitPrivacySwitchOnClick(evt,litId);
  });
  componentHandler.upgradeAllRegistered();
}

function makeLitEditButton(litId){
  let editOption =$("<li/>",{
    class: "mdl-list__item litEditButton",
    text: "Edit",
    click: (evt)=>{
      $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
      $(this).addClass("litSettingOptionSelected");
      litEditButtonOnClick(evt,litId)
    }
  });
  $(".settingOptions").append(editOption);
  componentHandler.upgradeAllRegistered();
}

function makeLitDelButton(litId){
  let deleteOption =$("<li/>",{
    class: "mdl-list__item litDelButton",
    text: "Delete",
    click: (evt)=>{
      $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
      $(this).addClass("litSettingOptionSelected");
      litDelButtonOnClick(evt,litId)
    }
  });
  $(".settingOptions").append(deleteOption);
  componentHandler.upgradeAllRegistered();
}

function makeLitPrivacySwitchOnClick(evt,litId){
  var isSelected = $("#privacySwitch").is(":checked");
  if(isSelected){
    //TODO set the work to private
  }
  else{
    //set the work to public
  }
  console.log("privacy: ",isSelected);
}

function litDelButtonOnClick(evt,litId){
  //TODO backEndAPI
  console.log("delete ",litId);
}

function litEditButtonOnClick(evt,litId){
  //TODO backEndAPI
  console.log("edit ",litId)
}

//----------------------------------------------------------

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
    //  console.log($.address.value());
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
             selectLit(selected_eppn,textChosen);
           }
         });
         worksButtons.append(litButton);
       }
       componentHandler.upgradeElement($('#worksButtons')[0]);
   });
 }

 function selectLit(selected_eppn,textChosen){
   console.log(selected_eppn,textChosen)
   $("#text").empty();
   $(".chosenUser").text(selected_eppn+":");
   $(".chosenFile").text(textChosen);
   let endpoint = 'get_work/' +selected_eppn + '/' + textChosen;
   showLink(endpoint);
   API.request({endpoint}).then((data) => {
       literatureText = data;
       buildHTMLFile(data,selected_eppn,textChosen);
   });
 }
