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

function createUserSelectScreen() {
  width = $(document).width();
  var userWorks = [];
  var selector = $("#userSelector");
  var usersItems = $("<ul/>", {
    id: "usersItems",
    class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
    for: "pickUser"
  });

  selector.append(usersItems);

  $.get("grabUsers.php", function(data) {
    // Add all users Folders
    var length = data.length;
    var rows = 0;
    while (length >= 1) {
      length -= 3;
      rows++;
    }

    for (var userNum in data) {
      var userItem = $("<li/>", {
        text: data[userNum],
        class: "mdl-menu__item userButton",
        click: function(evt) {
          $(".userFiles").show();
          userFolderSelected = $(this).text();
          $(".chosenUser").text(userFolderSelected + ":");
          $(".chosenFile").text("");
          $("#worksButtons").remove();
          readWhiteList();
          createLitSelectorScreen();
        }
      });

      usersItems.append(userItem);
    }

    componentHandler.upgradeElement($('#usersItems')[0]);

    $(".userFiles").hide();



  });

}

function createLitSelectorScreen() {
  var selector = $(".userFiles");
  var worksButtons = $("<ul/>", {
    id: "worksButtons",
    class: "mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect",
    for: "pickLit"
  });
  selector.append(worksButtons);
  var dataString = userFolderSelected;

  $.get("grabUserWorks.php", {
    folder: dataString
  }).done(function(data) {
    var works = JSON.parse(data);
    //console.log(works);

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
          //console.log(textChosen);
          // console.log(userChosen);
          // console.log($(this).attr("name"));
          getLitContents(userChosen, textChosen);
          removeSpans();
        }
      });

      if (userFolderSelected == user.getUserNetID() || whitelist.includes(user.getUserNetID())) {
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
    // var userReturnButton = $("<button/>", {
    //   id: "userReturnButton",
    //   text: "- Return to User Select -"
    // }).on("click", function(evt) {
    //   $(".litSelector").empty();
    //   $('div[aria-describedby="userPrivateList"]').hide();
    //   $('div[aria-describedby="moderateFileChoice"]').hide();
    //   createUserSelectScreen();
    // });
    // worksButtons.append("<br/>", userReturnButton);
    componentHandler.upgradeElement($('#worksButtons')[0]);

  });

  $.get("grabModeratedPages.php", {
    folder: dataString
  }).done(function(data) {
    var moderation = JSON.parse(data);
    //console.log(moderation);
    allModeratedPages = moderation;
    for (var lit in moderation) {
      if (!moderation[lit].includes(user.getUserNetID())) {
        var buttonMod = $("button[name='" + lit + "']");
        buttonMod.addClass("moderatedUserButton");
        //console.log(whitelist);
        if (!whitelist.includes(user.getUserNetID())) {
          buttonMod.attr("disabled", "disabled");
        }
      }
    }
  })
}
