function resetWhiteListSearch(){
  $(".searchWhiteList").val("");
  searchAction($(".searchWhiteList"),$(".whiteList"),"user");
}

function resetWhiteListPage(){
  enableAllWhiteListOption();
  let whiteList = $(".whiteListCheckBox");
  for(var i =0; i< whiteList.length ; i++){
    console.log(whiteList[i]["attributes"]["id"]["value"]);
    let id = whiteList[i]["attributes"]["id"]["value"];
    //checkbox is still checked
    if($("#"+escapeSpecialChar(id)).parent("label").hasClass("is-checked")){
      console.log("uncheck");
      $("#"+escapeSpecialChar(id)).off().click();
    }
  }
}

function settingGoBackButtonOnClick(){
  if ($("#settingBase").is(":visible")) {
    if($(".litSettingBase").is(":visible")){
      $("#setting").removeClass("active");
      $("#settingBase").hide();
      $("#nonTitleContent").show();
    }
    else if($(".whiteListSettingBase").is(":visible")){
      $(".whiteListSettingBase").hide();
      resetWhiteListSearch();
      resetWhiteListPage();
      $(".litSettingBase").show();
    }
  }
}

// mode will be user / work
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
    let skip = false;
    if(commenterId == undefined){
      if($(element).hasClass("selectorHeader") || $(element).find("input").attr("id")=="AllCommenters"){
        skip = true;
      }
      else{
        commenterId = $(element).find("input").attr("id");
      }
    }
    if(!skip){
      if(commenterId.toUpperCase().indexOf(searchKey.toUpperCase())>-1){
        $(element).show();
      }
      else{
        $(element).hide();
      }
    }
  });
}

function searchWork(list,searchKey){
  list.each((index,element)=>{
    let workId = $(element).attr("id");
    if(workId.toUpperCase().indexOf(searchKey.toUpperCase())>-1){
      $(element).show();
    }
    else{
      $(element).hide();
    }
  });
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
      class: "mdl-list__item-secondary-action whiteListCheckBoxSpan"
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

//TODO get the value from back end instead of the setting button
function checkIsWorkPublic(selected_eppn,litId){
  API.request({
    endpoint:"is_public/"+selected_eppn+"/"+litId,
    method: "GET"
  }).then((data)=>{
    console.log("isPublic",data);
    if(data == "false"){
      $("#privacySwitch").addClass("disabled").click();
      $("#privacySwitch").removeClass("disabled");
    }
  });
}

function checkIsCommentNeedApproval(selected_eppn,litId){
  console.log("is_comments_require_approval/"+selected_eppn+"/"+litId);
  API.request({
    endpoint: "is_comments_require_approval/"+selected_eppn+"/"+litId,
    method: "GET"
  }).then((data)=>{
    console.log("need approval ",data);
    if(data == "true"){
      $("#commentsNeedApprovalSwitch").addClass("disabled").click();
      $("#commentsNeedApprovalSwitch").removeClass("disabled");
    }
  });
}

function litSettingButtonOnClick(selectedLitId, selected_eppn){
  $("#nonTitleContent").hide();
  $("#settingBase").show();
  $(".whiteListSettingBase, #addLitBase").hide();
  $(".litSettingBase").empty().fadeIn();
  $("#settingTitle").text("Settings For : " + selected_eppn +"'s " +selectedLitId);
  let settingOptions = $("<div/>",{
    class: "settingOptions"
  });
  $(".litSettingBase").append(settingOptions);
  //privacy Switch
  makeSettingSwitch("privacy","Work is Private?",selectedLitId, selected_eppn,checkIsWorkPublic);
  //commentNeedApproval switch
  makeSettingSwitch("commentsNeedApproval","Comments Require Approval?",selectedLitId, selected_eppn, checkIsCommentNeedApproval);
  // whiteListPageOpener
  makeWhiteListButton(selectedLitId, selected_eppn);
  //activate the go back button
  $("#settingGoBack").children().off().on("click",()=>{
    settingGoBackButtonOnClick();
  });
}

// purpose : privacy / commentsNeedApproval
// return the input element and the event will be handle out side this function
function makeSettingSwitch(purpose, text, litId, selected_eppn, callback) {
  let option = $("<div/>", {
    text: text
  });

  let label= $("<label/>", {
    class: "mdl-switch mdl-js-switch mdl-js-ripple-effect",
    for: purpose + "Switch"
  });

  let input = $("<input/>", {
    type: "checkbox",
    id: purpose + "Switch",
    class: "mdl-switch__input"
  });

  $(".settingOptions").append(option);
  $(option).append(label);
  $(label).append(input);
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

function makeWhiteListButton(litId,selected_eppn){
  let whiteListOption = $("<div/>", {
    class: "litWhiteListButton",
    text: "Manage White List",
    click: evt => {
      if (isCurrentUserSelectedUser(selected_eppn, true)) {
        $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
        $(this).addClass("litSettingOptionSelected");
        showWhiteListSettingBase(litId, selected_eppn);
      }
    }
  });

  $(whiteListOption).append(`<i class="material-icons whiteListLinkIcon">link</i>`);
  $(".settingOptions").append(whiteListOption);
  componentHandler.upgradeAllRegistered();
}

//TODO php for commentsNeedApproval
function workSettingSwitchOnChange(evt,litId,selected_eppn){
  let currentTarget = evt["currentTarget"]["id"];
  let endPoint, message, isWorkPublic , commentsNeedApproval;
  let isSelected;
  if(currentTarget == "privacySwitch"){
    isSelected = $("#privacySwitch").is(":checked");
    if(isSelected){
      endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+false;
      message = "current work is set to private";
      isWorkPublic = "private";
    }else{
      endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+true;
      message = "current work is set to public";
      isWorkPublic = "public";
    }
    $("#setting").attr("isWorkPublic",isWorkPublic);
  }
  else{
    isSelected = $("#commentsNeedApprovalSwitch").is(":checked");
    if(isSelected){
      message = "comments need approval for current work";
      endPoint = "set_require_approval/"+selected_eppn+"/"+litId+"/"+true;
      commentsNeedApproval = "needApproval";
    }
    else{
      message = "comments don't need approval for current work";
      endPoint = "set_require_approval/"+selected_eppn+"/"+litId+"/"+false;
      commentsNeedApproval = "noApproval";
    }
    $("#setting").attr("commentsNeedApproval",commentsNeedApproval);
  }
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    launchToastNotifcation(message);
  });
}

//litId = literature name , selected_eppn = creator of the literature
function showWhiteListSettingBase(litId,selected_eppn){
  enableAllWhiteListOption();
  $(".whiteListSettingBase").fadeIn();
  $(".litSettingBase").hide();
  $(".whiteListCheckBoxSpan").children("label").removeClass("is-checked");
  var endPoint = "get_permissions_list/"+selected_eppn+"/"+litId;
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
          $("#"+escapeSpecialChar(inputs[j]["id"])).off().click();
          console.log(inputs[j]["id"]);
        }
      }
    }
    disableCreatorWhiteListOption(litId,selected_eppn);
    $(".whiteListCheckBox").off().on("change",(evt)=>{
      addUserToWhiteList(evt["currentTarget"]["id"],litId);
      console.log("clicked");
    });
  });
}

function enableAllWhiteListOption(){
  $(".whiteListCheckBox").removeAttr("disabled");
}

//litId = literature name, selected_eppn = creator of the work
function disableCreatorWhiteListOption(litId,selected_eppn){
  let inputId = "wl_"+selected_eppn;
  $("#"+escapeSpecialChar(inputId)).attr("disabled",true);
}

function addUserToWhiteList(selected_eppn, litId){
  let eppn = selected_eppn.split("_")[1];
  let endPoint;
  if($("#"+escapeSpecialChar(selected_eppn)).is(":checked")){
    endPoint = "add_permission/"+litId+"/"+eppn;
    //TODO notification is not well enough
    launchToastNotifcation(eppn+" is added to the white list");
  }
  else{
    endPoint = "remove_permission/"+litId+"/"+eppn;
    //TODO notification is not well enough
    launchToastNotifcation(eppn+" is removed from the white list");
  }
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    console.log(data);
    console.log(endPoint);
  });
}
