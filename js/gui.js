//TODO clean this function
$(window).ready(function() {
    $("#litadd").on("click", function(evt) {
        showAddLitPage();
        resetWhiteListPage();
    });

    $("#setting").addClass("disabledHeaderTab");
    $("#setting").off().on("click",()=>{
      let author = $("#setting").attr("author");
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
        $(".headerTab").removeClass("active");
        $("#setting").addClass("active");
        litSettingButtonOnClick(work,author);
      }
    });

    $("#home").off().on("click",function(){
      $(".headerTab").removeClass("active");
      $(this).addClass("active");
      homeButtonAction();
      resetWhiteListPage();
    });


});

function saveLit ({work, privacy, data} = {}){
  if (data.size > 2000000) {
    alert("Error: File too large. Can't be larger than 2Mb.");
    return;
  }

  const formData = new FormData();
  formData.append("file", data);
  formData.append("work", work);
  formData.append("privacy", privacy);

  //TODO this should be another function with the async users parameter to send in createUserMenuOption();
  // API.request({
  //   endpoint: "get_creators",
  //   method: "GET"
  // }).then((data)=>{
  //     console.log(data);
  //     let isCurrentUserNewCreator = true;
  //     for(var i = 0 ; i < data.length ; i++){
  //       if(data[i] == currentUser.eppn){
  //         console.log(currentUser.eppn);
  //         isCurrentUserNewCreator = false;
  //       }
  //     }
  //     let newCreator = createUserMenuOption(currentUser.eppn,users);
  //     console.log(users);
  //     $(".usersMenu").append(newCreator);
  // });

  API.request({
    endpoint: "create_work",
    method: "POST",
    data: formData
  }).then((data)=>{
    launchToastNotifcation(work + " is successfully created");
    $("#addLitSecondPage").show();
    $("#doneAddLit").show();
    $("#addLitFirstPage").hide();
    $(".uploadNotification").html('"<i>'+work + '</i>" is successfully created');
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
  $(".headerTab").removeClass("active");
  $("#home").addClass("active");
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
  
  for(i in user_list){
    var user = createUserMenuOption(user_list[i],users);
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

function createUserMenuOption(commenterId,users){
  console.log(users)
  var user = $("<li/>",{
    class:'mdl-list__item usersMenuOptions',
    commenterId: commenterId,
    text:commenterId,
    click: function(evt){
      $(".usersMenuOptions").removeClass("usersMenuSelected");
      $(this).addClass("usersMenuSelected");
      let selected_eppn = evt["currentTarget"]["attributes"]["commenterid"]["value"];
      showUsersLit(users,selected_eppn);
    }
  });
  return user;
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
          $(".worksMenuOptions").removeClass("workMenuSelected");
          $(this).addClass("workMenuSelected");
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

 function selectLit(selected_eppn,textChosen){
   console.log(selected_eppn,textChosen)
   $("#text").empty();
   $(".chosenUser").text(selected_eppn+":");
   $(".chosenFile").text(textChosen);
   let endpoint = 'get_work/' +selected_eppn + '/' + textChosen;
   showLink(endpoint);
   API.request({endpoint}).then((data) => {
       if(data["status"] != "error"){
         let literatureText = data['data'];
         let isWorkPublic = data['additional'];
         let commentsNeedApproval = data['additional2'];
         buildHTMLFile(literatureText,selected_eppn,textChosen);
         updateSettingPage(selected_eppn,textChosen,isWorkPublic,commentsNeedApproval);
       }
       else{
         //if work doesn't exist redirect to home
         $("#home").click();
         launchToastNotifcation("")
       }
   });
   //auto scroll to the text part
   window.scrollTo(0,$("#cardbox").position().top+$("#cardbox").height());
   //check the permission for settings
   checkworkAdminList(selected_eppn,textChosen,"setting");
   //check the permission for approving comments
   checkworkAdminList(selected_eppn,textChosen,"approvedComments");
 }

 function updateSettingPage(selected_eppn,textChosen,isWorkPublic,commentsNeedApproval){
   $("#setting").removeClass("disabledHeaderTab");
   $("#setting").attr({
     "author":selected_eppn,
     "work": textChosen,
     "isWorkPublic": isWorkPublic,
     "commentsNeedApproval": commentsNeedApproval
   });
   $("#settingBase").hide();
 }
