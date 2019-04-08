$(window).ready(function() {
    $("#litadd").on("click", function(evt) {
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
                if (fileName.length > 20) {
                    alert("File name can't exceed 20 characters");
                    return;
                }

                $("#fileName").text(fileName);
                $(".tempNameContainer").hide();
                $(".nameContainer").show();
                $("#addNameInput").val(fileName.substr(0, fileName.lastIndexOf('.')) || fileName);
            });

            $("#addUploadButton").on("click", function() {
                var name = $("#addNameInput").val();
                if (name == "" || name.length > 20) {
                    alert("Please choose a file name no longer than 20 characters");
                } else if (!/^[a-zA-Z0-9_\-\s\.\%\(\)]+$/.test(name)) {
                    alert("Please choose a file name with no special characters");
                } else {
                    saveLit(name, $("#privateCheck").is('.is-checked'), fileToSave);
                }
            });
        });
    });
});

createUserSelectScreen = async ({users = users} = {}) => {
  user_list = users.user_list;
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

  $(".userButton").click(async () => {
      $(".userFiles").show();
      let select_folder = $(this).text();
      console.log(select_folder);
      $(".chosenUser").text(select_folder + ":");
      $(".chosenFile").text("");
      $("#worksButtons").remove();
      await createLitSelectorScreen({users: users, selected_eppn: selected_eppn});
  });

  componentHandler.upgradeElement($('#usersItems')[0]);

  $(".userFiles").hide();
}

/**
 * Temporary pass the api object to 'everything'... 
 * So that any ~global~ function can make an api call...
 */
createLitSelectorScreen = async ({users = users, selected_eppn = selected_eppn} = {}) => {
  console.log(selected_eppn);
  var selector = $(".userFiles");
  var worksButtons = $("<ul/>", {
    id: "worksButtons",
    class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
    for: "pickLit"
  });
  selector.append(worksButtons);
  var dataString = selected_eppn;

  

  $.get("grabUserWorks.php", {
    folder: dataString
  }).done(function(data) {
    var works = JSON.parse(data);
    var length = works.length;
    var rows = 0;
    while (length >= 1) {
      length -= 3;
      rows++;
    }

    for (var lit in works) {
      var fileWithoutExt = works[lit].substr(0, works[lit].lastIndexOf('.')) || works[lit];
      var litButton = $('<li/>', {
        name: works[lit],
        class: "mdl-menu__item",
        id: "inputLitButton",
        text: fileWithoutExt,
        click: function(evt) {
          hideAllBoxes();
          $(".nameMenu").remove()
          $("#text").empty();
          $("div[aria-describedby='moderateFileChoice']").hide();
          textChosen = $(this).attr("name");
          $(".chosenFile").text(textChosen);
          userChosen = $(".chosenUser").html();
          getLitContents(userChosen, textChosen);
          removeSpans();
        }
      });

      if (userFolderSelected == currentUser['eppn'] || whitelist.includes(currentUser['eppn'])) {
        litButton.on('contextmenu', function(evt) {
          evt.preventDefault();
          setFileModeration(evt);
          var newTop = evt.pageY + "px";
          var newLeft = $(document).width() * .85 + "px";
          $('div[aria-describedby="moderateFileChoice"]').css({
            'top': newTop + "px",
            'left': newLeft + "px",
          })
          $('div[aria-describedby="userPrivateList"]').css({
            'top': newTop + "px",
            'left': newLeft + "px",
          })
        });
      }

      worksButtons.append(litButton);
    }

    componentHandler.upgradeElement($('#worksButtons')[0]);
  });
}
