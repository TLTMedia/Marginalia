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
      $("#settingBase").hide();
      $("#nonTitleContent").show();
    }
    else if($(".whiteListSettingBase").is(":visible")){
      $(".whiteListSettingBase").hide();
      resetWhiteListSearch();
      $(".litSettingBase").show();
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
      if(checkCurrentUserPermission(selected_eppn,true)){
        litSettingButtonOnClick(selectedLitId, selected_eppn);
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
    let workId = $(element).attr("id");
    if(workId.toUpperCase().indexOf(searchKey.toUpperCase())>-1){
      $(element).show();
    }
    else{
      $(element).hide();
    }
  });
}


// createSettingScreen = async ({users = users} = {}) =>{
//   $("#settingBase").hide();
//   user_list = users.creator_list;
//   for(i in user_list){
//     var user = $("<li/>",{
//       text:user_list[i],
//       class:'mdl-list__item settingUsers',
//       commenterId: user_list[i],
//       click: function(evt){
//         $(".settingUsers").removeClass("settingUserSelected");
//         $(this).addClass("settingUserSelected");
//         $("#litSettingButton").remove();
//         let selected_eppn = evt["currentTarget"]["attributes"]["commenterid"]["value"];
//         showUsersLit(users,selected_eppn);
//       }
//     });
//     $(".users").append(user);
//   }
//   //activate the search bar
//   $(".searchUser").on("keyup",()=>{
//     console.log("temperory disabled")
//     // let ul = $(".users");
//     // let input = $(".searchUser");
//     // searchAction(input,ul,"user");
//   });
//   makeWhiteListSettingBase(user_list);
// }

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

// function showUsersLit(users,selected_eppn){
//   $(".literatures").empty();
//   $(".settingLitDiv").fadeIn();
//   $(".settingLitDiv").find(".settingTitles").text(selected_eppn+"'s works:");
//   users.get_user_works(selected_eppn).then((works) => {
//     for (var lit in works) {
//       var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
//       var litButton = $('<li/>', {
//         class: "mdl-list__item settingLit",
//         id: "s"+works[lit],
//         text: fileWithoutExt,
//         click: function(evt){
//           $(".settingLit").removeClass("settingLitSelected");
//           $(this).addClass("settingLitSelected");
//           $("#litSettingButton").remove();
//           let selectedLitId = evt["currentTarget"]["id"];
//           makeWorkSettingButton(selected_eppn, selectedLitId);
//         }
//       });
//       $(".literatures").append(litButton);
//     }
//   });
//   $(".searchLit").on("keyup",()=>{
//     console.log("temperory diabled");
//     // let ul = $(".literatures");
//     // let input = $(".searchLit");
//     // searchAction(input,ul,"work");
//   });
// }

function litSettingButtonOnClick(selectedLitId, selected_eppn){
  $("#nonTitleContent").hide();
  $("#settingBase").show();
  $(".whiteListSettingBase").hide();
  $(".litSettingBase").empty();
  $(".litSettingBase").fadeIn();
  $("#settingTitle").text("Settings For : " + selected_eppn +"'s " +selectedLitId);
  var settingOptions = $("<ul/>",{
    class: "settingOptions mdl-list"
  });
  $(".litSettingBase").append(settingOptions);
  //private
  makeLitPrivacySwitch(selectedLitId, selected_eppn);
  //edit
  makeLitEditButton(selectedLitId, selected_eppn);
  //TODO test for getting whiteList of the work
  makeWhiteListButton(selectedLitId, selected_eppn);

  //activate the go back button
  $("#settingGoBack").children().off().on("click",()=>{
    settingGoBackButtonOnClick();
  });
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

function makeLitEditButton(litId, selected_eppn){
  let editOption =$("<li/>",{
    class: "mdl-list__item litEditButton",
    text: "Comments Need Approval"
  });
  var editSwitch = $("<label/>",{
    class: "mdl-switch mdl-js-switch mdl-js-ripple-effect",
    for: "editCommentsNeedAprroval"
  });
  var input = $("<input/>",{
    type: "checkbox",
    id: "editCommentsNeedAprroval",
    class: "mdl-switch__input"
  })
  $(".settingOptions").append(editOption);
  $(editOption).append(editSwitch);
  $(editSwitch).append(input);
  componentHandler.upgradeAllRegistered();
  input.on("click",(evt)=>{
    litEditSwitchOnClick(evt,litId);
  });
}

function makeWhiteListButton(litId,selected_eppn){
  let whiteListOption =$("<li/>",{
    class: "mdl-list__item litWhiteListButton",
    text: "Manage White List",
    click: (evt)=>{
      $(".litSettingOptionSelected").removeClass("litSettingOptionSelected");
      $(this).addClass("litSettingOptionSelected");
      showWhiteListSettingBase(litId,selected_eppn);
    }
  });
  $(".settingOptions").append(whiteListOption);
  componentHandler.upgradeAllRegistered();
}

function litPrivacySwitchOnClick(evt,litId,selected_eppn){
  var isSelected = $("#privacySwitch").is(":checked");
  let endPoint, message;
  if(isSelected){
    endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+false;
    message = "current work is set to private";
  }else{
    endPoint = "set_privacy/"+selected_eppn+"/"+litId+"/"+true;
    message = "current work is set to public";
  }
  console.log(endPoint);
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    launchToastNotifcation(message);
  });
}

function litEditSwitchOnClick(evt,litId){
  var isSelected = $("#editCommentsNeedAprroval").is(":checked");
  let endPoint,message;
  if(isSelected){
    message = "comments need approval on the current work";
    console.log(message);
  }
  else{
    message = "comments don't need approval on the current work";
    console.log(message);
  }
}

function enableAllWhiteListOption(){
  $(".whiteListCheckBox").removeAttr("disabled");
}

//litId = literature name, selected_eppn = creator of the work
function disableCreatorWhiteListOption(litId,selected_eppn){
  let inputId = "wl_"+selected_eppn;
  $("#"+escapeSpecialChar(inputId)).attr("disabled",true);
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
    // $(".whiteListCheckBox").off().on("change",(evt)=>{
    //   console.log("pls")
    // });
    for (var i =0; i< data["admins"].length; i++){
      let whiteListUser = data["admins"][i];
      let inputs = $(".whiteList").find("input");
      for(var j = 0; j< inputs.length;j++){
        if(inputs[j]["id"].split("_")[1] == whiteListUser){
          $("#"+escapeSpecialChar(inputs[j]["id"])).parent("label").addClass("is-checked");
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
    console.log(endPoint);
  });
}
