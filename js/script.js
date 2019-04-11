/**
 * TODO: temporary global until I recode the entire frontend... First just getting things to all work.
 */
var API;

var currentUser = {};
/**
 * Ends the temporarily known, necessary globals
 */

// Holds beginning information for user folder selection
var userFolderSelected; // The User-folder they've selected to view
var userFolderWorks = []; // The works that the user has



// Assists with comment saving
var isEdit = false; // If the sent text is an edit to a previous text
var isReply = false; // If the send text is a reply
var isReplyEdit = false; // If the sent text is an edit to a reply

// Adminstrative helpers, first of multiple checks
var whitelist = []; // the admins of the website, double checked in PHP
var idName = [0]; // The name and id of the span clicked on

// Holds comment and reply information
var userComMap = new Map(); // id and map of user comments
var userReplyMap = new Map(); // id and map of user replies
var adminApproveMap = new Map(); // map of admin approved comments
var commentIndexMap = new Map(); // map of start/end index of comments
var commentTypeMap = new Map(); // map of comment types
var allModeratedPages; // All pages that have moderation
var allUserComments; // All comments within this text
var textChosen; // the name of the beginning text chosen
var literatureText = ""; // The literal string of all the text
var remSpan; // holds the name of made and clicked spans

// The height and width of the webpage
var height = 0;
var width = 0;
// Initialization function
/*
  Hides the loading symbol
  Loads the userdata obtained by the netID login
  Loads the users folder and creates a button for each user
*/
init = async ({api = api, users = users} = {}) => {
  API = api;
  currentUser = users.current_user;

  $(".loader").hide();
  $("#text").hide();
  $("#addLitBase").hide();
  createUserSelectScreen({users: users});

  $(window).on("resize", function() {
    var stageWidth = $(window).width();
    $("#text").css("height", $("#litDiv").height() + "px");
    $("html").css("font-size", (stageWidth / 60) + "px");
  }).trigger("resize")
}

// Creates a visual list of all users which gives access to their folders
/*
  Loads the user's works folder and creates a button for each work they have
  When the button is clicked the variable userFolderSelected is the work's name
  The cooresponding work then has it's text and comment/reply data loaded
*/



function buildHTMLFile(litContents, litName) {
  //console.log(litContents);
  var litDiv = $("<div/>", {
    "id": "litDiv"
  }).on("mouseup", function(evt) {
    highlightCurrentSelection(evt).then(function(data) {})
  });

  var metaChar = $("<meta/>", {
    "charset": "utf-8"
  });
  var metaName = $("<meta/>", {
    "name": "viewport",
    "content": 'width=device-width, initial-scale=1.0'
  });

  var link = $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    media: "only screen",
    href: "css/style.css"
  });

  var script = $("<script/>", {
    "src": "//code.jquery.com/jquery-3.3.1.js",
    "integrity": "sha256-2Kok7MbOyxpgUVvAk/HJ2jigOSYS2auK4Pfzbm7uH60=",
    "crossorigin": "anonymous"
  });

  var preText = $("<div/>", {
    "id": "textSpace"
  });
  preText.hide();
  //litContents = litContents.replace(/\n\n/g, "\n");
  //litContents = litContents.replace(/\n/g, "<br/>");
  preText.html(litContents);

  litDiv.append(metaChar, metaName, link, script, preText);
  $("#text").append(litDiv);
}

function getLitContents(current_user, current_text) {
  let endpoint = 'get_work/' + current_user + '/' + current_text;
  API.request({endpoint}).then((data) => {
      literatureText = data;
      buildHTMLFile(literatureText, $(this).attr("class"))
      makeBoxes();
  });
}
// Creates the main selector screen once a netid is chosen
/*
  For every .txt read within the user's works folder a button is made
  a return button is made in the event that clicking this user was a mistake
*/


// opens the menu for file moderation Selection
/*
  When the user right clicks this element a checkbox
  is displayed and if activated the user selects to make
  the page moderated.

  This only works if the user is the owner of the page
*/
function setFileModeration(clicked) {
  var target = $(clicked.currentTarget).attr("name").toLowerCase();
  //console.log(target.toLowerCase());

  $("#moderateFileChoice").dialog({
    width: "14%",
    height: "1.5%",
    title: "Private " + target
  });

  $("div[aria-describedby='moderateFileChoice']").show();

  if ($("ul[class='choiceList']").length < 1) {

    var choiceList = $('<ul/>', {
      class: "choiceList"
    });

    var moderateButton = $('<input/>', {
      type: "checkbox",
      id: "moderateButton"
    });

    var doneButton = $("<button/>", {
      id: "doneButton",
      text: "Done",
      click: function(evt) {
        var send = !(allModeratedPages.hasOwnProperty(target)) && $("#moderateButton").prop("checked");
        $("div[aria-describedby='userPrivateList']").hide();
        // Check to make sure file doesn't exist with a check or doesn't without
        // No post request will be made then
        var alreadyChecked = allModeratedPages.hasOwnProperty(target) && $("#moderateButton").prop("checked");
        var dontHave = !(allModeratedPages.hasOwnProperty(target)) && !$("#moderateButton").prop("checked");

        if (send) {
          allModeratedPages[target] = [currentUser['eppn']];
        }
        var dataString = JSON.stringify({
          "type": $("#moderateButton").prop("checked"),
          "work": target
        })

        if (!alreadyChecked && !dontHave) {
          //console.log(target)
          $.post("moderatepage.php", {
            data: dataString
          }).done(function(data) {
            console.log("Private Status Changed");
          });
        }
        $(this).parent().parent().hide();
      }
    });
    choiceList.append("Private: ", moderateButton, doneButton);
    $("div[aria-describedby='moderateFileChoice']").append(choiceList);
  }
  openFileModerators(clicked);

  console.log(target, allModeratedPages);
  $("#moderateButton").prop("checked", allModeratedPages.hasOwnProperty(target));

}

// Opens the user's private page when this is clicked, giving those people access
/*
  This is getting confused with moderation which for now means privatization
  When a user right clicks the file button the list of private users access displays
  Those given access to the privatization can then be given access to this text
*/
function openFileModerators(clicked) {
  var target = $(clicked.currentTarget).attr("name").toLowerCase();
  if (!($("#addPrivateUser").length > 0)) {
    var privatePlane = $("<div/>", {
      id: "privatePlane"
    });
    var addPrivateUser = $("<input/>", {
      id: "addPrivateUser",
      placeholder: "Enter netID",
      width: "3.5rem"
    }).on("keypress", function(evt) {
      if ($("#addPrivateUser").val().length > 9) {
        $("#addPrivateUser").val($("#addPrivateUser").val().substring(0, 9));
      }
    });


    var addPrivateButton = $("<button/>", {
      id: "addPrivateButton",
      text: "Add",
      width: "2.5rem",
      click: function(evt) {
        var text = $("#addPrivateUser").val();
        var pass = true;
        var givenNetIDs = $("#privateNamePlane").children();

        for (var privateNetID in givenNetIDs) {
          if (!(isNaN(privateNetID))) {
            console.log($(givenNetIDs[privateNetID]).text(), text);
            if ($(givenNetIDs[privateNetID]).text() == text.toUpperCase()) {
              pass = false;
            }
          } else {
            continue;
          }
        }

        if (pass) {
          var dataString = JSON.stringify(text);
          // $.post("moderatepage.php",{
          //   data:dataString
          // }).done(console.log("Hello"));
          var count = $("#privateNamePlane").children().length;

          var newDiv = $("<div/>", {
            text: text.toUpperCase(),
            id: "privateName_" + count
          });
          $("#privateNamePlane").append(newDiv);
          $("#privateNamePlane").css({
            "height": (count + 1) + "rem"
          });

          newDiv.on("click", function(evt) {
            var idNum = $(this).attr("id").substring($(this).attr("id").length - 1);

            if ($("#removePrivateName_" + idNum).length == 0) {
              var removeNameButton = $("<button/>", {
                text: "Delete?",
                id: "removePrivateName_" + idNum,
                click: function(evt) {
                  $(this).parent().remove();
                  var count = $("#privateNamePlane").children().length;
                  $("#privateNamePlane").css({
                    "height": count + "rem"
                  });
                }
              });
              $("#privateName_" + idNum).append(removeNameButton);
            } else {
              $("#removePrivateName_" + idNum).remove();
            }
          });

        }
      }
    });
    var privateNamePlane = $("<div/>", {
      id: "privateNamePlane"
    });
    privatePlane.append(addPrivateUser, addPrivateButton, privateNamePlane);

    $("div[aria-describedby='moderateFileChoice']").append(privatePlane);
  }
  $("#addPrivateUser").val("");
  $.get("loadPrivateUsers.php", {
    file: target
  }).done(function(data) {
    var nameArray = JSON.parse(data);
    console.log(nameArray);
    fillUserPrivateList(nameArray);

  });

  $("div[aria-describedby='userPrivateList']").show();
}


function fillUserPrivateList(nameArray) {
  $("#privateNamePlane").empty();
  var namePlane = $("#privateNamePlane");

  if (nameArray) {
    $("#privateNamePlane").css({
      "height": 1 * nameArray.length + "rem"
    });
    for (var name in nameArray) {
      var addName = $("<div/>", {
        text: (nameArray[name].toUpperCase()),
        id: "privateName_" + name
      });
      addName.on("click", function(evt) {
        var idNum = $(this).attr("id").substring($(this).attr("id").length - 1);

        if ($("#removePrivateName_" + idNum).length == 0) {
          var removeNameButton = $("<button/>", {
            text: "Delete?",
            id: "removePrivateName_" + idNum,
            click: function(evt) {
              $(this).parent().remove();
              var count = $("#privateNamePlane").children().length;
              $("#privateNamePlane").css({
                "height": count + "rem"
              });
            }
          });
          $("#privateName_" + idNum).append(removeNameButton);
        } else {
          $("#removePrivateName_" + idNum).remove();
        }
      });
      $("#privateNamePlane").append(addName);
    }
  } else {
    $("#privateNamePlane").css({
      "height": 0
    });
  }
}



/*
    Uploads the user's .docx file...
    @var litname : the name the file should be saved as on the server
    @var private : true/false specifies whether it's a private file
        if true, file is hidden from other users; only visible to self
    @var litfile : file object data ... (the file data to upload)
*/
saveLit = ({work, privacy, data} = {}) => {
  console.log(work, privacy, data);
  var formData = new FormData();
  formData.append("file", data);

  let jsonData = JSON.stringify({
    file: formData,
    work: work,
    privacy: privacy
  });

  console.log(jsonData);

  API.request({
    endpoint: "create_work",
    method: "POST",
    data: jsonData
  }).then((data) => {
    console.log(data);
  });
}


// This function is not used but can be looked at for reference
// function init() {
//   // Holds information on input comments, the literature shown
//   // and the different buttons that can be made
//   var dropdown;
//   var lit;
//   var comment;
//
//   getLit(textChosen).then(function(data) {
//     lit = data;
//     makeBoxes();
//   }).fail(function(data) {
//     lit = data
//   }).always(function() {
//     var litDiv = $('<div/>', {
//       id: "litDiv",
//       html: lit
//     }).on("mouseup", function(evt) {
//       highlightCurrentSelection(evt, currentUser['eppn'])
//     });
//     $('#text').append(litDiv);
//   })
// }

// Load the user's comments after a work button is clicked
/*
  Fills the 3 comment variables with the comment/reply data
  Each is mapped with its cooresponding Hex-Encoded UNIX timestamp
  The student selection menu is filled with each student's netid
*/
loadUserComments = () => {
  $("#text").hide();
  $("#textSpace").hide();
  $("#textTitle").hide();
  $(".loader").show();

  let endpoint = "get_comments/" + $(".chosenUser").text().split(":")[0] + "/" + textChosen;
  API.request({endpoint}).then((data) => {
      renderComments(data);
  });
}

renderComments = (commentData) => {
    $(".allButtons").show();
    $(".loader").hide();
    $("#text").fadeIn();
    $("#textSpace").fadeIn();
    $("#textTitle").fadeIn();

    for (let i = 0; i < commentData.length; ++i) {
        let [,hash,eppn,] = commentData[i].path.split("/").reverse()
        makeSpan(
            hash,
            commentData[i].firstName,
            commentData[i].lastName,
            commentData[i].startIndex,
            commentData[i].endIndex,
            commentData[i].visibility,
            eppn,
            commentData[i].commentType,
            btoa(commentData[i].commentText)
        );
    }

    $("#text").css("height", $("#litDiv").height() + "px");
}

// Makes a span out of its components
/*
A span is composed of class, firstname, lastname, start index, endindex,
                      innertext, isvisible, userid and type
*/
function makeSpan(classID, firstName, lastName, startDex, endDex, isVisible, eppn, type, commentText) {
  var rangeMake = rangy.createRange();
  rangeMake.selectCharacters(document.getElementById("textSpace"), startDex, endDex);
  hlRange(rangeMake);

  var span = $("." + remSpan);
  span.attr("class", classID);
  span.attr("firstname", firstName);
  span.attr("lastname", lastName);
  span.attr("eppn", eppn);
  span.attr("commentType", type);
  span.attr("commentText", commentText);
  span.attr("title", "By: " + firstName + " " + lastName);

  $(span).off().on("click", function(evt) {
    var eppn = $(this).attr("eppn");
    var type = $(this).attr("commentType");

    $(".commentTypeDropdown").val(
        type.charAt(0).toUpperCase() + type.substr(1)
    );
    
    $("[id='ui-id-1']").text("Annotation by: " + $(this).attr("firstname") + " " + $(this).attr("lastname"));

    CKEDITOR.instances.textForm.setData(atob($(this).attr("commentText")));
    if (eppn != currentUser.eppn && whitelist.includes(currentUser.eppn)) {
      isEdit = true;
    }

    evt.stopPropagation();
    displayReplyBox(evt);
    displayCommentBox(evt);
    textShowReply();
    hideUnconfirmedHighlights();

    remSpan = $(evt.currentTarget).attr("class");

    CKEDITOR.instances['textForm'].setReadOnly(true);
    $(".commentTypeDropdown").attr("disabled", "disabled");
    if (eppn == currentUser.eppn || whitelist.includes(currentUser.eppn)) {
      $("#commentSave").hide();
      $("#commentRemove").show();
      $("#commentExit").show();
      $("#commentEdit").show();
    } else {
      $("#commentSave").hide();
      $("#commentEdit").hide();
      $("#commentRemove").hide();
      $("#commentExit").show();
    }
  });
}

// Who is able to edit every comment or reply
/*
  This adds together both the site-admins along with the student's relative
  admin powers, if requested the user can ask to give other people admin powers
*/

// Admin approval form where all comments go to at first
/*
  When a comment is made by a user and they are not any sort of admin it goes
  though a comment approval form which is visible to admins, once allowed it
  becomes visible to every user
*/
function createCommentAprovalForm() {
  $("#comApproval").dialog({
    width: 500,
    title: "Approval Box"
  });
  $('[aria-describedby="comApproval"]').hide();
}

// Using the approval map this fill in the admin ability to approve a person comment
function fillAdminApprovalMap() {
  $('div[id="comApproval"]').empty();
  var keys = adminApproveMap.keys();

  console.log(adminApproveMap.size + " Approvals")
  if (adminApproveMap.size == 0) {
    $('[aria-describedby="comApproval"]').hide();
  } else {
    for (var i = 0; i < adminApproveMap.size; i++) {
      var value = adminApproveMap.get(keys.next().value)

      // console.log(value);
      var approveBase = $('<div/>', {
        class: "approve_" + i,
        id: value.timeStamp

      });

      var approveName = $('<text/>', {
        class: "approveName"
      });

      approveName.text(value.firstname + " " + value.lastname);

      var approveArea = $('<textArea/>', {
        class: "approveArea"
      });
      // Gives the admin a look into what the student quoted on and what the quote was
      var comment = value.commentData.replace(/<\/p>/g, "\n");
      comment = comment.replace(/<[^>]*>/g, "");
      comment = comment.replace(/<p>/g, "");
      approveArea.text("User Input:\n" + comment + "\n\nFor Text Selection: \n" +
        literatureText.substring(value.startIndex, value.endIndex));

      approveArea[0].disabled = true;

      var replyApproveButton = $('<button/>', {
        class: "replyApproveButton",
        click: function(evt) {
          $(this).parent().remove();
          commentApproval(true, $(this).parent().attr("id"));
          if ($("#comApproval div").length == 0) {
            $('[aria-describedby="comApproval"]').remove();
          }
        }
      });

      var replyDisapproveButton = $('<button/>', {
        class: "replyDisapproveButton",
        click: function(evt) {
          $(this).parent().remove();
          commentApproval(false, $(this).parent().attr("id"));
          if ($("#comApproval div").length == 0) {
            $('[aria-describedby="comApproval"]').remove();
          }
          console.log("Disapprove Comment")
        }
      });

      replyApproveButton.text("Approve");
      replyDisapproveButton.text("Disapprove");
      approveBase.append(approveName, approveArea, replyApproveButton, replyDisapproveButton);
      $("#comApproval").append(approveBase);

    }

    var newLeft = width * .55 + "px";

    $('[aria-describedby="comApproval"]').css({
      'top': -($(document).height() - (200 * adminApproveMap.size) - 50) + "px",
      'left': width * .55 + "px",
    });
  }

  height = $(document).height();
  console.log("Hello There");
}

// If true then go the path of approving the comment
// If false then remove the comment
function commentApproval(approved, id) {
  var yetApprove = adminApproveMap.get(id);
  console.log(yetApprove)
  var dataString;
  if (approved) {
    console.log("APPROVE COMMENT");
    var dataString = JSON.stringify({
      user: yetApprove.userID,
      firstname: yetApprove.firstname,
      lastname: yetApprove.lastname,
      type: yetApprove.type,
      comData: yetApprove.commentData,
      startDex: yetApprove.startIndex,
      endDex: yetApprove.endIndex,
      timeStamp: yetApprove.timeStamp,
      textChosen: (textChosen.substr(0, textChosen.lastIndexOf("."))),
      userFolder: userFolderSelected
    });
    $.post("save.php", {
        data: dataString
      })
      .done(function(msg) {
        console.log('Data Sent')
      }).fail(function(msg) {
        console.log("Data Failed to Send")
      });
  } else {
    console.log("DISAPPROVE COMMENT");

    var dataString = JSON.stringify({
      user: yetApprove.userID,
      removalID: yetApprove.userID,
      timeID: yetApprove.timeStamp,
      isReply: false,
      textChosen: (textChosen.substr(0, textChosen.lastIndexOf("."))),
      userFolder: userFolderSelected
    });
    console.log(dataString)
    $.post("remove.php", {
        data: dataString
      })
      .done(function(msg) {
        console.log('Comment Removed ')
      }).fail(function(msg) {
        console.log("Comment Failed to Remove " + msg[0])
      });
  }

}

// Compilation of creating the userBoxes
function makeBoxes() {
  makeSelectionButtons();
  makeDraggableCommentBox();
  makeDraggableReplyBox();
  hideAllBoxes();
}

// Make the X-Cross that will be used to close out of the comments / reply box
function makeCrossX() {
  return `<svg width="15px" height ="15px" class = "crossX" viewBox="0 0 100 100">
    <line x1="0" y1="0" x2="15px" y2="15px" style="stroke:#ff0000; stroke-width:1.5"></line>
    <line x1="0" y1="15px" x2="15px" y2="0" style="stroke:#ff0000; stroke-width:1.5"></line>
    </svg>`;
}

// This will consturct the selection buttons within the grey box to the top right
// Good HTML is Short HTML
function makeSelectionButtons() {
  dropdown = $("<select>", {
    class: "commentTypeDropdown",
  });

  var buttonTypes = ['All', 'Historical', 'Analytical', 'Comment', 'Definition', 'Question', 'Private', 'Students'];

  var allButtons = $('<ul/>', {
    class: "allButtons"
  });

  if ($(".nameMenu").length <= 0) {
    buttonTypes.forEach(function(type) {
      // Fill the dropdown bar with these data points
      if (type != "All" && type != "Students") {

        var option = $("<option>", {
          name: type,
          text: type
        });

        if ($("#commentTypeDropdown").length == 0) {
          dropdown.append(option);
          $("#commentTypeDropdown").val(option);
        }

      }


      if (type != "Students") {

        var list = $('<li/>', {
          class: "button"
        });

        var radioLabel = $("<label>", {
          class: "mdl-radio mdl-js-radio",
          id: "button" + type,
          for: type
        });

        var input = $('<input/>', {
          type: "radio",
          id: type,
          name: "commentType",
          class: "mdl-radio__button"
        });

        var spanText = $("<span>", {
          class: "mdl-radio__label",
          text: type
        });

        $(list).append(radioLabel);
        $(radioLabel).append(input, spanText);
        $(allButtons).append(list);

        input.on("click", function(evt) {
          if (!($(this).parent().attr("class") == "button active")) {
            loadCommentsByType($(this).attr("id").toLowerCase(), false);
            $(".active").removeClass("active");
            $(this).parent().addClass("active");

          }
        });

        console.log();
        componentHandler.upgradeElement($(radioLabel)[0]);
      }
    })
  }

  if ($(".allButtons").length == 0) {
    $
      ('#loadlist').append(allButtons);

  }
  $(".commentTypeDropdown").val(buttonTypes[0]);
  $("[id='All']").click();
  $("[id='All']").parent().addClass("active");
  loadUserComments();
}

// Loads all comments of a certain type whether it be a student name or type
function loadCommentsByType(type, isNetID) {
  var allComsOfType = [];

  // If the type is determined by netID at first
  if (isNetID) {
    for (var student in allUserComments) {

      if ((allUserComments[student].netID == type) && (allUserComments[student].isVisible == true ||
          type == currentUser.netid)) {
        var account = allUserComments[student];
        console.log(account);
        for (var com in account.comments) {
          var comment = account.comments[com];
          $(comment).attr("netID", account.netID)
          allComsOfType.push(comment);
        }
      }
    }
  } else {
    for (var student in allUserComments) {
      var account = allUserComments[student];

      for (var com in account.comments) {
        var comment = account.comments[com];
        $(comment).attr("netID", account.netID)
        if ((comment.type == type || type == "all") && (comment.isVisible == true || comment.userID == currentUser.netid ||
            whitelist.includes(currentUser.netid))) {
          console.log(comment);
          allComsOfType.push(comment);
        }
      }
    }
  }
  removeSpans();
  loadArrayOfComments(allComsOfType);
}

// loads all the comments from an array, used when a type button is pressed
function loadArrayOfComments(comments) {
  var selRange = rangy.createRange();
  for (var i in comments) {
    var comment = comments[i];
    var id = comment.netID + "_" + comment.timeStamp;
    selRange.selectCharacters(document.getElementById("textSpace"), comment.startIndex, comment.endIndex);

    hlRange(selRange)
    console.log("LOAD ARRAY OF COMMENTS");
    var span = $("." + remSpan);
    $(span).off().on("click", function(evt) {
      console.log("TESTER2");
      $("#commentRemove").text("Remove");
      // if ($(this).attr("class").substring(0, 3) != "hl_") {
      $("[id='ui-id-1']").text("Annotation by: " + $(this).attr("firstname") + " " + $(this).attr("lastname"));
      idName = $(this).attr("class").split("_");

      if (idName[0] == currentUser.netid || whitelist.includes(currentUser.netid)) {
        CKEDITOR.instances['textForm'].setReadOnly(false);
        $(".commentTypeDropdown").removeAttr("disabled");
        $("#commentSave").show();
        $("#commentRemove").show();
        $("#commentExit").hide("Exit");
      } else {
        CKEDITOR.instances['textForm'].setReadOnly(true);
        $(".commentTypeDropdown").attr("disabled", "disabled");
        $("#commentSave").hide();
        $("#commentRemove").hide();
        $("#commentExit").show("Exit");
      }
      evt.stopPropagation();
      hideUnconfirmedHighlights();
      clickDisplayComments(evt, idName[1])
      remSpan = $(evt.currentTarget).attr("class");
      //  }
    });

    span.attr("class", id);
    span.attr("firstname", comment.firstname);
    span.attr("lastname", comment.lastname);
    span.attr("userid", comment.userID);
  }
}

// Removes all highlights on the text
function removeSpans() {
  var spanArray = $("span[firstname]").toArray();
  for (var i = 0; i < spanArray.length; i++) {

    remSpan = $(spanArray[i]).attr("class");
    resetCkeAndHide();
  }
}

// This displays the comment box after a user has clicked a comment made already
function clickDisplayComments(evt, id) {
  console.log("COMMENT");
  var span = $("." + remSpan);
  console.log(userComMap.get(id));
  CKEDITOR.instances.textForm.setData(userComMap.get(id));
  CKEDITOR.instances['textForm'].setReadOnly(false);
  var newTop = evt.pageY + "px";
  var newLeft = width * .55 + "px";

  $("[aria-describedby='commentBox']").css({
    'top': newTop,
    'left': newLeft
  })

  $("div[aria-describedby='commentBox']").attr('comID', id);

  $("[aria-describedby='commentBox']").show();


}

// This displays the comment box in a position near where the user ends their hl
function displayCommentBox(evt) {
  // console.log($(document).height());
  // console.log("Mouse Pos: " + evt.clientX, evt.clientY + "\nScroll Position: " + $(window).scrollTop());
  var newLeft = (width * .55) + "px";
  var newTop = (evt.pageY - 100) + "px";


  if (evt.pageY + 300 > $(document).height()) {
    newTop = $(document).height() - 300 + "px";
  } else if ((evt.pageY - 100) < 0) {
    newTop = "0px";
  }
  $("[aria-describedby='commentBox']").css({
    'top': newTop,
    'left': newLeft
  })

  $("[aria-describedby='commentBox']").show();
}

// This displays the replies for the current comment box
function displayReplyBox(evt) {
  var newTop = evt.pageY + "px";

  var newLeft = width * .55 + "px";

  $("[aria-describedby='replies']").css({
    'top': newTop,
    'left': newLeft
  })

  $("[aria-describedby='replies']").show();
}

// Displays the box given after a highlight is clicked
// If the view comment is clicked and the user is the creator then
// the power of editing the text is given d
function displayChoiceBox(evt) {
  $("[aria-describedby='commentBox']").hide();
  $("[aria-describedby='replies']").hide();

  var newTop = evt.pageY + "px";

  var newLeft = width * .55 + "px";

  $("[aria-describedby='choices']").css({
    'top': newTop,
    'left': newLeft
  })

  $("[aria-describedby='choices']").show();
}

// This is the box that will house the various replies a comment thread may hold
function makeDraggableReplyBox() {
  $("#replies").dialog({
    dialogClass: "no-close",
    use: 'reply',
    modal: true,
    width: 500,
    title: "Reply Box"
  });

  createCommentAprovalForm();

}

// When opened, the reply box will have a place for you to type in the commentbox
function createSelfReplyBoxButton() {

  var makeReplyBox = $('<button/>', {
    class: "makeReplyBox",
    text: "Make a Reply",
    click: function(evt) {
      $("[id='ui-id-1']").text("Reply by: " + currentUser.fullname);
      $(this).remove();
      comBoxReply(evt);
      $("#commentSave").show();
      $("#commentRemove").show();
      $("#commentEdit").hide();
      $("#commentExit").hide();
      $("#commentRemove").text("Cancel");
      $(".commentTypeDropdown").hide();
      CKEDITOR.instances['textForm'].setReadOnly(false);

      //addSelfReplyBox();
    }
  });
  $("#replies").append(makeReplyBox);
}

// This makes the box of which will be used to place text into
// only one will be made and it will be emptied and repurposed to save computing power
// It then hides it
function makeDraggableCommentBox() {


  if ($('div[aria-describedby="commentBox"]').length < 1) {
    if ($(".commentTypeDropdown").length < 1) {
      $("#commentBox").append(dropdown);
    }

    remSpan = null;

    $(this).parent().parent().hide();

    $("#commentBox").dialog({
      dialogClass: "no-close",
      modal: true,
      width: 500,
      use: 'comments',
      buttons: [{
          text: "Save",
          id: "commentSave",
          click: function() {
            // First check if there is any content within the commentBox to prevent empty saves
            // Sanatize imputs to prevent unintended text from coming through
            var editorText = CKEDITOR.instances.textForm.getData();

            // Removes all textArea additions to check raw text
            editorText = editorText.replace(/<[^>]*>/g, "");
            var origText = editorText;

            editorText = editorText.replace(/&nbsp;/g, "");
            editorText = editorText.replace(/<p>/g, "");
            editorText = editorText.replace(/<p\/>/g, "");
            editorText = editorText.replace(/ /g, "");

            console.log("RAW TEXT:\n", editorText);

            var noComment = (editorText.length < 1);

            // Checks if it isnt the error text
            var notNormalComment = (origText.includes("You have to put a comment here first!")) || (origText.includes("Not this comment!"));

            // if it's the first error text then replaces
            if (!noComment && notNormalComment) {

              CKEDITOR.instances.textForm.setData("Not this comment!");

            } else if (noComment || notNormalComment) {

              CKEDITOR.instances.textForm.setData("You have to put a comment here first!");

            } else {
              // if it is neither then it goes forwards with the save
              // If this is a reply to a comment then it saves the reply
              // otherwise it is a comment save/edit/overwrite
              if (isReply) {
                saveUserReply();
              } else {
                console.log("Saved As Comment");
                saveUserComment();
                $(this).parent().hide();
              }
            }
          }
        },
        {
          text: "Edit",
          id: "commentEdit",
          click: function(evt) {
            console.log("REMSPAN: ", remSpan.split("_"))
            if (currentUser.netid == remSpan.split("_")[0]) {
              isEdit = true;
            }
            clickDisplayComments(evt, remSpan.split("_")[1]);
            $("[aria-describedby='replies']").hide();
            // $("#commentSave").text("Save");
            $("#commentSave").show();
            $("#commentExit").hide();
            $("#commentEdit").hide();
            $(".commentTypeDropdown").attr("disabled", false);
          }
        }, {
          text: "Remove",
          id: "commentRemove",
          click: function() {
            $("#commentRemove").text("Remove");
            if (!isReply) {
              resetCkeAndHide();
              hideUnconfirmedHighlights();
              removeUserComment();
              remSpan = null;
            } else {
              hideAllBoxes();
            }
          }
        },
        {
          text: "Exit",
          id: "commentExit",
          click: function() {
            CKEDITOR.instances.textForm.setData("");
            $("[aria-describedby='replies']").hide();
            $("[aria-describedby='commentBox']").hide();
          }
        },

      ],
      title: "Annotation by: "
    });

    // Making the actual commentForm system
    var comForm = $('<form/>');
    var textForm = $('<textarea/>', {
      id: "textForm",
      rows: "10",
      cols: "80"
    });

    $(comForm).append(textForm);
    $('#commentBox').append(comForm);
    $('#commentExit').hide();
    CKEDITOR.replace('textForm');
  }
}

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
  $("[aria-describedby='replies']").hide();
  $("[aria-describedby='commentBox']").hide();
  $("[aria-describedby='choices']").hide();
}

// When a user clicks to show the replies the comment box is displayed
// So that they can view the comment they're replying to
function textShowReply() {
  var position = $("[aria-describedby='replies']").css("top");
  position = parseInt(position.substring(0, position.length - 2));
  position = (position - 325);
  if (position < 0) {
    $("[aria-describedby='replies']").css({
      "top": -(position) + 200 + "px"
    });
    position = 0;
  }
  $("[aria-describedby='commentBox']").css({
    "top": position + "px"
  });
  $("#commentSave").hide();
  $("#commentRemove").hide();
  $("#commentExit").show();

  CKEDITOR.instances['textForm'].setReadOnly(true);

  $(".commentTypeDropdown").attr("disabled", "disabled");
}

// fills the replyBox with comments linked to it
// Fills with comments from idName value
function fillReplyBox(evt) {
  $('div[id="replies"]').empty();
  $(".makeReplyBox").css("margin-top", 0);

  var replies = userReplyMap.get(idName[1]);
  if (replies.length > 2) {
    var viewReplies = $("<button/>", {
      text: "View Replies: (" + replies.length + ")",
      id: "viewRepliesButton",
      click: function() {
        var dfd = new $.Deferred();
        $(".makeReplyBox").remove();
        $(".leaveReplyBox").remove();
        $(this).remove();
        for (var replyNum in replies) {
          var reply = JSON.parse(replies[replyNum]);

          var replyBase = $('<div/>', {
            class: "replyBase_" + replyNum,
            replyID: reply.timeStamp,
            userID: currentUser.netID
          });

          var replyName = $('<text/>', {
            class: "replyName"
          });

          var fullname = reply.firstname + " " + reply.lastname;
          var userReply = (fullname == currentUser.fullname);
          replyName.text(fullname);
          var replyArea = $('<textArea/>', {
            class: "replyArea"
          });

          var inText = reply.commentData;

          replyArea[0].disabled = true;
          inText = inText.replace(/<\/p>/g, "\n");
          inText = inText.replace(/<[^>]*>/g, "");

          replyArea.text(inText);

          var replyDeleteButton = $('<button/>', {
            class: "replyDeleteButton",
            text: "Delete",
            click: function(evt) {
              if ($(this).text() == "Delete") {
                $(this).parent().children(".replyEditButton").text("No, i'm not");
                $(this).text("Are you sure?");
              } else if ($(this).text() == "Are you sure?") {
                CKEDITOR.instances.textForm.setData("");
                $("#commentSave").hide();
                removeUserReply(evt);
              }
            }
          });

          var replyEditButton = $('<button/>', {
            class: "replyEditButton",
            text: "Edit",
            click: function(evt) {
              if ($(this).text() == "No, i'm not") {
                $($(this).siblings()[2]).text("Delete");
                $(this).text("Edit");
              } else {
                CKEDITOR.instances.textForm.setData((($(this).siblings())[1]).innerHTML);
                comBoxReply(evt);
                $("#commentSave").show();
                $("#commentEdit").hide();
                $("#commentRemove").hide();
                $(".leaveReplyBox").hide();
                CKEDITOR.instances['textForm'].setReadOnly(false);
                console.log("Edit this Reply");
                isReplyEdit = true;
                isEdit = $(this).parent().attr("replyid");
              }
            }
          });

          if (!userReply && !whitelist.includes(currentUser.netid)) {
            replyDeleteButton.attr("disabled", "disabled");
            replyEditButton.attr("disabled", "disabled");
          }

          replyBase.append(replyName, replyArea, replyDeleteButton, replyEditButton);

          $("#replies").append(replyBase);

        }
        createSelfReplyBoxButton();
        return dfd;
      }
    });
  }
  $("#replies").append(viewReplies);
  createSelfReplyBoxButton();

  if (replies.length == 0) {
    $(".makeReplyBox").css("margin-top", "40px");
  }
}

// opens the commentBox in order for a reply to be made
function comBoxReply(evt) {
  CKEDITOR.instances.textForm.setData("");
  $(".commentTypeDropdown").hide()
  //$("#commentRemove").hide()
  $("id[ui-id-1]").text("Reply by: " + currentUser.fullname);

  var newTop = evt.pageY + "px";

  var newLeft = width * .50 + "px";

  if (!$("div[aria-describedby='commentBox']").is(":visible")) {
    $("div[aria-describedby='commentBox']").css({
      'top': newTop,
      'left': newLeft,
    });

    $("div[aria-describedby='replies']").css({
      'top': evt.pageY,
      'left': "5%",
    });
  }

  $("div[aria-describedby='commentBox']").show();
  $("div[aria-describedby='replies']").show();



  isReply = true;
}

// Finds all user highlights that haven't been highlighted and removes them
function hideUnconfirmedHighlights() {
  $(".hl_" + currentUser.netid).each(function() {
    var attributes = this.attributes;
    var i = attributes.length;
    while (i-- && i != 0) {
      this.removeAttributeNode(attributes[i]);
    }
  });
  unhighlight("hl_" + currentUser.netid);
}


// This function will reset the CKEditor and all attributes
function resetCkeAndHide() {
  $("." + remSpan).each(function() {
    var attributes = this.attributes;
    var i = attributes.length;
    while (i-- && i != 0) {
      this.removeAttributeNode(attributes[i]);
    }
  });
  unhighlight(remSpan);
  CKEDITOR.instances.textForm.setData("");
  $("[aria-describedby='commentBox']").hide();
  $("[aria-describedby='replies']").hide();
}

// From here on are the php applicable functions and all things "offsite"

// This removes a reply from the reply list if it's the user's or is an admin
function removeUserReply(evt) {

  var replyID = ($(evt.currentTarget).parent()).attr("replyID");
  //userReplyMap.delete(idName[1]);

  var dataString = JSON.stringify({
    replyID: replyID,
    user: currentUser.netid,
    comCreator: idName[0],
    directoryPath: idName[1],
    isReply: true,
    textChosen: textChosen,
    userFolder: userFolderSelected
  })
  console.log(JSON.parse(dataString));
  $.post("remove.php", {
      data: dataString
    })
    .done(function(msg) {
      console.log('Data Sent');
      $(evt.currentTarget).parent().remove();
    }).fail(function(msg) {
      console.log("Data Failed to Send")
    });
}

// This will remove the selected user comment from the system
function removeUserComment() {
  if (isEdit) {
    time = $("[aria-describedby='commentBox']").attr("comID");
    // $("[aria-describedby='commentBox']").attr("comID", undefined);
  }

  var dataString;

  // will do another check within the php file for admin powers
  var time = idName[1];
  if (idName != [0]) {
    dataString = JSON.stringify({
      user: currentUser.netid,
      timeID: time,
      removalID: idName[0],
      isReply: false,
      textChosen: textChosen,
      userFolder: userFolderSelected
    });
  } else {
    dataString = JSON.stringify({
      user: currentUser.netid,
      timeID: time,
      isReply: false,
      textChosen: textChosen,
      userFolder: userFolderSelected
    });
  }
  console.log(JSON.parse(dataString));
  isEdit = false;
  isReplyEdit = false;
  console.log(dataString);

  if (time != 0) {
    $.post("remove.php", {
        data: dataString
      })
      .done(function(msg) {
        console.log('Comment Removed ')
      }).fail(function(msg) {
        console.log("Comment Failed to Remove " + msg[0])
      });
  }
}

// Saves a users comment, edits it whether it is the one who made it or an admin
function saveUserComment() {
  // double check if the send comment comes from admin access

  var timeSt = Math.floor(Date.now() / 1000).toString(16);
  var cData = CKEDITOR.instances.textForm.getData();
  var newSpanClass = currentUser.netid + "_" + timeSt;
  var span = $("." + remSpan);
  var type = $(".commentTypeDropdown").val();
  if (type == null) {
    type = "historical";
  }
  type = type.toLowerCase();

  // Sending information
  var firstName = currentUser.firstname;
  var lastName = currentUser.lastname;
  var netID = currentUser.netid;

  CKEDITOR.instances.textForm.setData("");
  if (isEdit) {
    var span = $("." + remSpan);
    timeSt = idName[1];
    netID = idName[0];
    firstName = span.attr("firstname");
    lastName = span.attr("lastname");
    newSpanClass = netID + "_" + timeSt;

    $("[aria-describedby='commentBox']").attr("comID", undefined);
  } else {
    console.log("USER IS TRYING TO SAVE COMMENT: " + timeSt);
    span.attr("class", newSpanClass);
  }

  //span.attr("Innertext", cData);

  // Everything below here is PHP

  // If the user is editing a text then the unique comment ID will stay the same
  // That is, the hex unix timestamp. The name of the class will also stay the same

  // Saves a client version of the comment as a refresh would be required
  /*******/
  if (!(userReplyMap.has(timeSt))) {
    userReplyMap.set(timeSt, []);
    commentIndexMap.set(timeSt, [span.attr("startIndex"), span.attr("endIndex")]);
    userComMap.set(timeSt, cData);
    span.removeAttr("startIndex");
    span.removeAttr("endIndex");
  }
  /*******/

  // TODO: Find the error occuring when it comes to text not loading in the right place

  //console.log(literature.substring(commentIndexMap.get(timeSt)[0],commentIndexMap.get(timeSt)[1]));

  // var dataString = JSON.stringify({
  //   user: netID,
  //   firstname: firstName,
  //   lastname: lastName,
  //   type: type,
  //   comData: cData,
  //   startDex: commentIndexMap.get(timeSt)[0],
  //   endDex: commentIndexMap.get(timeSt)[1],
  //   timeStamp: timeSt,
  //   textChosen: (textChosen.substr(0, textChosen.lastIndexOf("."))),
  //   userFolder: userFolderSelected
  // });


  //console.log(JSON.parse(dataString));
  $.ajax("api/public/save_comments/", {
      data: JSON.stringify({
          author: userFolderSelected,
          work: textChosen,
          replyTo: "_", // if it's a comment to a comment...
          replyHash: "_", // ^ (no backend exists for this yet)
          startIndex: commentIndexMap.get(timeSt)[0],
          endIndex: commentIndexMap.get(timeSt)[1],
          commentText: cData,
          commentType: type
      }),
      contentType: 'application/json',
      type : 'POST'
    })
    .done(function(msg) {
      console.log('Data Sent')
    }).fail(function(msg) {
      console.log("Data Failed to Send")
    });
}

// Saves a user's reply to a thread
function saveUserReply() {

  var timeSt = Math.floor(Date.now() / 1000).toString(16);
  var firstName = currentUser.firstname;
  var lastName = currentUser.lastname;
  var netID = currentUser.netid;

  if (isReplyEdit) {
    timeSt = isEdit;
    hideAllBoxes();
  } else {
    // Saves a client version of the comment map as a refresh would be required
    /*******/
    var comArray = userReplyMap.get(idName[1]);
    var clientReply = JSON.stringify({
      commentData: CKEDITOR.instances.textForm.getData(),
      timeStamp: timeSt,
      firstname: currentUser.firstname,
      lastname: currentUser.lastname
    });
    comArray.push(clientReply);
    /*******/
  }
  console.log(CKEDITOR.instances.textForm.getData())
  var dataString = JSON.stringify({
    mainUser: idName[0],
    comID: idName[1],
    repData: CKEDITOR.instances.textForm.getData(),
    timeStamp: timeSt,
    firstname: firstName,
    lastname: lastName,
    netID: netID,
    textChosen: textChosen,
    userFolder: userFolderSelected
  });
  console.log(JSON.parse(dataString));

  isEdit = false;
  isReplyEdit = false;
  $.post("reply.php", {
      data: dataString
    })
    .done(function(msg) {
      console.log('Data Sent')
    }).fail(function(msg) {
      console.log("Data Failed to Send")
    });

  var inText = CKEDITOR.instances.textForm.getData();
  var fullname = firstName + " " + lastName;
  var userReply = true;
  var replyBase = $('<div/>', {
    class: "replyBase_" + timeSt,
    replyID: timeSt,
    userIsD: currentUser.netID
  });

  var replyName = $('<text/>', {
    class: "replyName",
    text: fullname
  });

  var replyArea = $('<textArea/>', {
    class: "replyArea"
  });

  replyArea[0].disabled = true;
  inText = inText.replace(/<\/p>/g, "\n");
  inText = inText.replace(/<[^>]*>/g, "");

  replyArea.text(inText);

  var replyDeleteButton = $('<button/>', {
    class: "replyDeleteButton",
    text: "Delete",
    click: function(evt) {
      if ($(this).text() == "Delete") {
        $(this).parent().children(".replyEditButton").text("No, i'm not");
        $(this).text("Are you sure?");
      } else if ($(this).text() == "Are you sure?") {
        removeUserReply(evt);
      }
    }
  });

  var replyEditButton = $('<button/>', {
    class: "replyEditButton",
    text: "Edit",
    click: function(evt) {
      if ($(this).text() == "No, i'm not") {
        $($(this).siblings()[2]).text("Delete");
        $(this).text("Edit");
      } else {
        CKEDITOR.instances.textForm.setData((($(this).siblings())[1]).innerHTML);
        comBoxReply(evt);
        $("#commentSave").show();
        $("#commentEdit").hide();
        $("#commentRemove").hide();
        CKEDITOR.instances['textForm'].setReadOnly(false);
        console.log("Edit this Reply");
        isReplyEdit = true;
        isEdit = $(this).parent().attr("replyid");
      }
    }
  });

  if (!userReply && !whitelist.includes(currentUser.netid)) {
    replyDeleteButton.attr("disabled", "disabled");
    replyEditButton.attr("disabled", "disabled");
  }

  replyBase.append(replyName, replyArea, replyDeleteButton, replyEditButton);
  if ($("#viewRepliesButton").is(":visible")) {
    $("#viewRepliesButton").click().then(function() {
      $("#replies").append(replyBase);
    });
  } else {
    $("#replies").append(replyBase);
  }
  CKEDITOR.instances.textForm.setData("");
  createSelfReplyBoxButton();
  ///
}
