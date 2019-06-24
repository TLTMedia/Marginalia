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
  $("#text , .userFiles, #settingBase, #addLitBase").hide();
  $("#nonTitleContent").show();
  $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
  resetSettingTitle();
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
             let textChosen = evt['currentTarget']['id'];
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
       let literatureText = data;
       buildHTMLFile(data,selected_eppn,textChosen);
   });
 }
