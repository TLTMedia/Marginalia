function settingButtonAction(evt){
  $("#addLitBase , #nonTitleContent").hide();
  $("#settingBase, .settingUserDiv, #settingTitle").fadeIn();
  $(".settingLitDiv, .litSettingBase, .whiteListSettingBase").hide();
  $("#settingGoBack").children().off().on("click",()=>{
    settingGoBackButtonOnClick();
  });
}

function resetSettingTitle(){
  $("#settingTitle").text("Settings");
}
function resetUserSearch(){
  $(".searchUser").val("");
  searchAction($(".searchUser"),$(".users"),"user");
}
function resetLitSearch(){
  $(".searchLit").val("");
  searchAction($(".searchLit"),$(".literatures"),"work");
}
function resetWhiteListSearch(){
  $(".searchWhiteList").val("");
  searchAction($(".searchWhiteList"),$(".whiteList"),"user");
}

function settingGoBackButtonOnClick(){
  if ($("#settingBase").is(":visible")) {
    if($(".litSettingBase").is(":visible")){
      $(".litSettingBase").hide();
      $("#settingTitle, .settingUserDiv, .settingLitDiv").show();
      resetSettingTitle();
    }
    else if($(".whiteListSettingBase").is(":visible")){
      $(".whiteListSettingBase").hide();
      resetWhiteListSearch();
      $(".litSettingBase").show();
    }
    else{
      $("#settingBase").hide();
      resetUserSearch();
      resetLitSearch();
      $("#nonTitleContent").show();
    }
  }
}

function makeWorkSettingButton(selected_eppn,selectedLitId){
  $("#litSettingButton").remove();
  let id = "litSettingButton";
  let dest = ".settingLitDiv";
  var button = $("<button/>",{
    class: "mdl-button mdl-js-button mdl-button--icon",
    click: (evt)=>{
      let litId = selectedLitId.slice(1,selectedLitId.length);
      if(checkPermission(selected_eppn,litId)){
        litSettingButtonOnClick(evt,selectedLitId, selected_eppn);
      }
    }
  });
  var icon = $("<i/>",{
    class: "material-icons",
    text: "settings"
  });
  var settingButtons = $('<span/>',{
    id: id
  });
  $(settingButtons).append(button);
  $(button).append(icon);
  $(dest).append(settingButtons);
  componentHandler.upgradeAllRegistered();
}

// mode will be user/ work
function searchAction(input, ul, mode){
  searchKey = input.val();
  list = ul.find("li");
  if(mode == "user"){
    searchUser(list,searchKey);
  }
  else if(mode == "work"){
    searchWork(list,searchKey);
  }
}
function searchUser(list,searchKey){
  list.each((index,element)=>{
    let commenterId = $(element).attr("commenterId");
    if(commenterId.toUpperCase().indexOf(searchKey.toUpperCase())>-1){
      $(element).show();
    }
    else{
      $(element).hide();
    }
  });
}

function searchWork(list,searchKey){
  list.each((index,element)=>{
    let workId = $(element).attr("id").slice(1);
    if(workId.toUpperCase().indexOf(searchKey.toUpperCase())>-1){
      $(element).show();
    }
    else{
      $(element).hide();
    }
  });
}


createSettingScreen = async ({users = users} = {}) =>{
  $("#settingBase").hide();
  user_list = users.creator_list;
  for(i in user_list){
    var user = $("<li/>",{
      text:user_list[i],
      class:'mdl-list__item settingUsers',
      commenterId: user_list[i],
      click: function(evt){
        $(".settingUsers").removeClass("settingUserSelected");
        $(this).addClass("settingUserSelected");
        $("#litSettingButton").remove();
        let selected_eppn = evt["currentTarget"]["attributes"]["commenterid"]["value"];
        showUsersLit(users,selected_eppn);
      }
    });
    $(".users").append(user);
  }
  //activate the search bar
  $(".searchUser").on("keyup",()=>{
    let ul = $(".users");
    let input = $(".searchUser");
    searchAction(input,ul,"user");
  });
  makeWhiteListSettingBase(user_list);
}

function makeWhiteListSettingBase(user_list){
  var whiteList = $("<ul/>",{
    class: "mdl-list whiteList"
  });
  let whiteListTitle = $("<h6/>",{
    class: "whiteListTitle",
    text: "Click on the check box to add the user to the white list"
  });
  let whiteListSearch = $("<input/>",{
    class: "searchWhiteList",
    placeholder: "Search for users..",
    keyup: ()=>{
      let ul = $(".whiteList");
      let input = $(".searchWhiteList");
      searchAction(input,ul,"user");
    }
  });
  for(i in user_list){
    let user = $("<li/>",{
      text:user_list[i],
      class:'mdl-list__item whiteListOption',
      commenterId: user_list[i]
    });
    let span = $("<span/>",{
      class: "mdl-list__item-secondary-action whiteListOptionCheckBox"
    });
    let label = $("<label/>",{
      class: "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect",
      for: "wl_"+user_list[i]
    });
    let input = $("<input/>",{
      class: "mdl-checkbox__input whiteListCheckBox",
      type: "checkbox",
      id: "wl_"+user_list[i]
    });
    $(label).append(input);
    $(span).append(label);
    $(user).append(span);
    $(whiteList).append(user);
  }
  $(".whiteListSettingBase").append(whiteListTitle,whiteListSearch,whiteList);
  componentHandler.upgradeAllRegistered();
}

function showUsersLit(users,selected_eppn){
  $(".literatures").empty();
  $(".settingLitDiv").fadeIn();
  $(".settingLitDiv").find(".settingTitles").text(selected_eppn+"'s works:");
  users.get_user_works(selected_eppn).then((works) => {
    for (var lit in works) {
      var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
      var litButton = $('<li/>', {
        class: "mdl-list__item settingLit",
        id: "s"+works[lit],
        text: fileWithoutExt,
        click: function(evt){
          $(".settingLit").removeClass("settingLitSelected");
          $(this).addClass("settingLitSelected");
          $("#litSettingButton").remove();
          let selectedLitId = evt["currentTarget"]["id"];
          makeWorkSettingButton(selected_eppn, selectedLitId);
        }
      });
      $(".literatures").append(litButton);
    }
  });
  $(".searchLit").on("keyup",()=>{
    let ul = $(".literatures");
    let input = $(".searchLit");
    searchAction(input,ul,"work");
  });
}

function litSettingButtonOnClick(evt,selectedLitId, selected_eppn){
  $(".settingUserDiv, .settingLitDiv").hide();
  $(".litSettingBase").empty();
  $(".litSettingBase").fadeIn();
  let litId = selectedLitId.slice(1,selectedLitId.length);
  $("#settingTitle").text("Settings For : " + selected_eppn +"'s " +litId);
  var settingOptions = $("<ul/>",{
    class: "settingOptions mdl-list"
  });
  $(".litSettingBase").append(settingOptions);
  //private
  makeLitPrivacySwitch(litId, selected_eppn);
  //edit
  makeLitEditButton(litId);
  //delete
  makeLitDelButton(litId);
  //TODO test for getting whiteList of the work
  makeWhiteListButton(litId);
}

function makeLitPrivacySwitch(litId, selected_eppn){
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
    litPrivacySwitchOnClick(evt,litId,selected_eppn);
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

function makeWhiteListButton(litId){
  let whiteListOption =$("<li/>",{
    class: "mdl-list__item litWhiteListButton",
    text: "Manage White List",
    click: (evt)=>{
      $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
      $(this).addClass("litSettingOptionSelected");
      showWhiteListSettingBase(litId);
    }
  });
  $(".settingOptions").append(whiteListOption);
  componentHandler.upgradeAllRegistered();
}

function litPrivacySwitchOnClick(evt,litId,selected_eppn){
  var isSelected = $("#privacySwitch").is(":checked");
  let endPoint;
  if(isSelected){
    endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+false;
  }else{
    endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+true;
  }
  console.log(endPoint);
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    console.log(data);
  });
}

function litDelButtonOnClick(evt,litId){
  //TODO backEndAPI
  console.log("delete ",litId);
}

function litEditButtonOnClick(evt,litId){
  //TODO backEndAPI
  console.log("edit ",litId)
}


//TODO backEnd dont allow other users to access the list
//not sure what are the white list's permission
function showWhiteListSettingBase(litId){
  $(".whiteListSettingBase").fadeIn();
  $(".litSettingBase").hide();
  $(".whiteListOptionCheckBox").children("label").removeClass("is-checked");
  var endPoint = "get_permissions_list/"+litId;
  console.log(endPoint)
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    for (var i =0; i< data["admins"].length; i++){
      let whiteListUser = data["admins"][i];
      let inputs = $(".whiteList").find("input");
      for(var j = 0; j< inputs.length;j++){
        if(inputs[j]["id"].split("_")[1] == whiteListUser){
          $("#"+escapeSpecialChar(inputs[j]["id"])).parent("label").addClass("is-checked");
        }
      }
    }
  });
  $(".whiteListCheckBox").off().on("click",(evt)=>{
    addUserToWhiteList(evt["currentTarget"]["id"],litId);
  });
}

function addUserToWhiteList(selected_eppn, litId){
  let eppn = selected_eppn.split("_")[1];
  let endPoint;
  if($("#"+escapeSpecialChar(selected_eppn)).is(":checked")){
    endPoint = "add_permission/"+litId+"/"+eppn;
    //TODO notification is not well enough
    launchToastNotifcation(eppn+"is added to the white list");
  }
  else{
    endPoint = "remove_permission/"+litId+"/"+eppn;
    //TODO notification is not well enough
    launchToastNotifcation(eppn+"is removed from the white list");
  }
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    console.log(data);
  });
}
