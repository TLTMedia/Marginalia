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
        //TODO find a better way to add this in here
        resetWhiteListPage();
    });

    $("#setting").addClass("disabledHeaderTab");
    $("#setting").off().on("click",()=>{
      let author =$("#setting").attr("author");
      let work = $("#setting").attr("work");
      console.log(author, work);
      //TODO setting page sometimes shows up before the checking authority works
      if($("#setting").hasClass("disabledHeaderTab")){
        launchToastNotifcation("Please select a work first");
      }
      else if($("#setting").hasClass("noPermission")){
        launchToastNotifcation("You don't have the permission to do this action");
      }
      else{
        litSettingButtonOnClick(work,author);
      }
    });

    $("#home").off().on("click",function(){
      homeButtonAction();
      resetWhiteListPage();
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
  $("#text , .userFiles, #settingBase, #addLitBase").hide();
  $("#nonTitleContent").show();
  $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
  //disable the setting header tab
  $("#setting").addClass("disabledHeaderTab");
  resetSettingTitle();
  //TODO this is the old hide box with wierd query
  hideAllBoxes();
  //hideReplyBox();
  //hideCommentBox();
}
//----------------------------------------------------------

createUserSelectScreen = async ({users = users} = {}) =>{
  $(".workSelectMenu").hide();
  user_list = users.creator_list;
  // TODO need to check what does this width thing do
  // figure out why this is here
  width = $(document).width();
  for(i in user_list){
    var user = $("<li/>",{
      text:user_list[i],
      class:'mdl-list__item usersMenuOptions',
      commenterId: user_list[i],
      click: function(evt){
        $(".usersMenuOptions").removeClass("settingUserSelected");
        $(this).addClass("settingUserSelected");
        $("#litSettingButton").remove();
        let selected_eppn = evt["currentTarget"]["attributes"]["commenterid"]["value"];
        showUsersLit(users,selected_eppn);
      }
    });
    $(".usersMenu").append(user);
  }
  //activate the search bar
  $(".searchUser").on("keyup",()=>{
    let ul = $(".usersMenu");
    let input = $(".searchUser");
    searchAction(input,ul,"user");
  });
  //make the white list
  makeWhiteListSettingBase(user_list);
}

function showUsersLit(users,selected_eppn){
  $(".worksMenu").empty();
  $(".workSelectMenu").fadeIn();
  $(".workSelectMenu").find(".worksMenuTitle").text(selected_eppn+"'s works:");
  users.get_user_works(selected_eppn).then((works) => {
    for (var lit in works) {
      var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
      var litButton = $('<li/>', {
        class: "mdl-list__item worksMenuOptions",
        id: works[lit],
        text: fileWithoutExt,
        click: function(evt){
          $(".worksMenuOptions").removeClass("settingLitSelected");
          $(this).addClass("settingLitSelected");
          let selectedWorkId = evt["currentTarget"]["id"];
          selectLit(selected_eppn,selectedWorkId);

        }
      });
      $(".worksMenu").append(litButton);
    }
  });
  $(".searchLit").on("keyup",()=>{
    let ul = $(".worksMenu");
    let input = $(".searchLit");
    searchAction(input,ul,"work");
  });
}

//------- old ui for selecting users and their works-----------------

// createUserSelectScreen = async ({users = users} = {}) => {
//   user_list = users.creator_list;
//   width = $(document).width();
//   var userWorks = [];
//   var selector = $("#userSelector");
//   var usersItems = $("<ul/>", {
//     id: "usersItems",
//     class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
//     for: "pickUser"
//   });
//   selector.append(usersItems);
//   var length = user_list.length;
//   var rows = 0;
//   while (length >= 1) {
//     length -= 3;
//     rows++;
//   }
//   for (let userNum in user_list) {
//     let userItem = $("<li/>", {
//       text: user_list[userNum],
//       class: "mdl-menu__item userButton"
//     });
//
//     usersItems.append(userItem);
//   }
//   $(".userButton").click(function() {
//     //  console.log($.address.value());
//       $(".userFiles").show();
//       let selected_eppn = $(this).text();
//       $(".chosenUser").text(selected_eppn + ":");
//       $(".chosenFile").text("");
//       $("#worksButtons").remove();
//       createLitSelectorScreen({users: users, selected_eppn: selected_eppn});
//   });
//   componentHandler.upgradeElement($('#usersItems')[0]);
//   $(".userFiles").hide();
// }

/**
 * Temporary pass the api object to 'everything'...
 * So that any ~global~ function can make an api call...
 */
 // createLitSelectorScreen = ({users = users, selected_eppn = selected_eppn} = {}) => {
 //   var selector = $(".userFiles");
 //   var worksButtons = $("<ul/>", {
 //     id: "worksButtons",
 //     class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
 //     for: "pickLit"
 //   });
 //   selector.append(worksButtons);
 //   users.get_user_works(selected_eppn).then((works) => {
 //       for (var lit in works) {
 //         var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
 //         var litButton = $('<li/>', {
 //           class: "mdl-menu__item",
 //           id: works[lit],
 //           text: fileWithoutExt,
 //           click: function(evt) {
 //             hideAllBoxes();
 //             $(".nameMenu").remove();
 //             let textChosen = evt['currentTarget']['id'];
 //             selectLit(selected_eppn,textChosen);
 //           }
 //         });
 //         worksButtons.append(litButton);
 //       }
 //       componentHandler.upgradeElement($('#worksButtons')[0]);
 //   });
 // }

 function selectLit(selected_eppn,textChosen){
   console.log(selected_eppn,textChosen)
   $("#text").empty();
   $(".chosenUser").text(selected_eppn+":");
   $(".chosenFile").text(textChosen);
   let endpoint = 'get_work/' +selected_eppn + '/' + textChosen;
   showLink(endpoint);
   API.request({endpoint}).then((data) => {
       let literatureText = data['data'];
       let workIsPublic;
       buildHTMLFile(literatureText,selected_eppn,textChosen);
       updateSettingPage(selected_eppn,textChosen,data['additional']);
   });
   //auto scroll to the text part
   window.scrollTo(0,$("#cardbox").position().top+$("#cardbox").height());
   //check the permission for settings
   checkworkAdminList(selected_eppn,textChosen,"setting");
   //check the permission for approving comments
   checkworkAdminList(selected_eppn,textChosen,"approvedComments");
 }

 function updateSettingPage(selected_eppn,textChosen,workIsPublic){
   $("#setting").removeClass("disabledHeaderTab");
   $("#setting").attr({
     "author":selected_eppn,
     "work": textChosen,
     "isWorkPublic": workIsPublic
   });
   $("#settingBase").hide();
 }
