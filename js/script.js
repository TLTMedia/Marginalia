var API;
var TEXTSPACE = "textSpace";


var currentUser = {};
/**
 * Ends the temporarily known, necessary globals
 */
// Adminstrative helpers, first of multiple checks
var whitelist = []; // the admins of the website, double checked in PHP
var idName = [0]; // The name and id of the span clicked on

var textChosen; // the name of the beginning text chosen
var literatureText = ""; // The literal string of all the text
var remSpan; // holds the name of made and clicked spans

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
  createSettingScreen({users:users});

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
  if (!$(".commentTypeDropdown").length) {
    makeDropDown();
    makeDraggableCommentBox();
    makeDraggableReplyBox();
    hideAllBoxes();
    loadUserComments();
  } else {
    loadUserComments();
  }

  var litDiv = $("<div/>", {
    "id": "litDiv"
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

  preText.html(litContents);

  litDiv.append(metaChar, metaName, link, script, preText);
  $("#text").append(litDiv);

}
// Creates the main selector screen once a netid is chosen
/*
  For every .txt read within the user's works folder a button is made
  a return button is made in the event that clicking this user was a mistake
*/

function makeDropDown() {
  dropdown = $("<select>", {
    class: "commentTypeDropdown",
  });

  let buttonTypes = [
    'All',
    'Historical',
    'Analytical',
    'Comment',
    'Definition',
    'Question'
  ];

  let allButtons = $('<ul/>', {
    class: "allButtons"
  });

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

      let list = $('<li/>', {
        class: "button"
      });

      let radioLabel = $("<label>", {
        class: "mdl-radio mdl-js-radio",
        id: "button" + type,
        name: "commentType",
        for: type
      });

      let input = $('<input/>', {
        type: "radio",
        id: type,
        name: "commentType",
        class: "mdl-radio__button",
      });

      let spanText = $("<span>", {
        class: "mdl-radio__label",
        text: type
      });

      $(list).append(radioLabel);
      $(radioLabel).append(input, spanText);
      $(allButtons).append(list);
      input.on("click", (evt)=>{
        var currentSelectedType = evt["currentTarget"]["id"];
        var currentSelectedCommenter = $("#commenterSelector").attr("currentTarget");
        //var currentSelectedCommenter = $("is-clicked"+"[name = 'commenterSelector']").attr("for");
        $("#loadlist").attr("currentTarget",currentSelectedType);
        //if the commenter selector is not created set to allCommenters
        if(currentSelectedCommenter == undefined){
          newDropDownSelect(currentSelectedType,"AllCommenters");
        }
        else{
          newDropDownSelect(currentSelectedType,currentSelectedCommenter);
        }
      });
      componentHandler.upgradeElement($(radioLabel)[0]);
    }
  })

  if ($(".allButtons").length == 0) {
    $('#loadlist').append(allButtons);
  }
  $(".commentTypeDropdown").val(buttonTypes[0]);

  $("#All").click();
  //$("#All").parent().addClass("active");
}

function dropDownSelect(currentSelectedType){
  if (currentSelectedType == "All") {
    $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  } else {
    $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 0.0)"});
    $(".commented-selection" + "[typeof='" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
}

function newDropDownSelect(currentSelectedType, currentSelectedCommenter){
  console.log(currentSelectedType);
  var currentSelectedCommenterEppn = currentSelectedCommenter.split("_")[1];
  console.log(currentSelectedCommenterEppn);
  $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 0.0)"});
  if (currentSelectedType == "All" && currentSelectedCommenterEppn == "AllCommenters"){
    console.log("1")
    $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedCommenterEppn == "AllCommenters"){
    console.log("2")
    $(".commented-selection" + "[typeof='" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedType == "All"){
    console.log("3")
    $(".commented-selection" + "[creator ='" + currentSelectedCommenterEppn + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else{
    console.log("4");
    $(".commented-selection" + "[creator ='" + currentSelectedCommenterEppn + "'][typeof = '" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
}

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
  //TODO get rid of textChosen
  let endpoint = "get_highlights/" + $(".chosenUser").text().split(":")[0] + "/" + textChosen;
  API.request({endpoint}).then((data) => {
      renderComments(data);
      makeCommentersDropDown(createListOfCommenter(data));
  });
}

renderComments = (commentData) => {
    $(".allButtons").show();
    $(".loader").hide();
    $("#text").fadeIn();
    $("#textSpace").fadeIn();
    $("#textTitle").fadeIn();
    $("#commentEdit").hide();

    for (let i = 0; i < commentData.length; ++i) {
        highlightText({
            startIndex: commentData[i].startIndex,
            endIndex: commentData[i].endIndex,
            commentType: commentData[i].commentType,
            eppn: commentData[i].eppn,
            hash: commentData[i].hash,
        });

    }
    $("#text").css("height", $("#litDiv").height() + "px");

    $("#litDiv").on("mouseup", function(evt) {
      highlightCurrentSelection(evt);
    });

    $(".commented-selection").off().on("click", function(evt) {
      var commentSpanId = $(this).attr('id');
      console.log(commentSpanId);
      clickOnComment(commentSpanId, evt);
    });
}

function createListOfCommenter(data){
  var commenters=[];
  commenters.push(data[0].eppn);
  for (var i = 1; i < data.length; i ++){
    var eppn = data[i].eppn;
    var eppnExist = false;
    for(var j = 0; j< commenters.length; j++){
      if(commenters[j] == eppn){
        eppnExist = true;
      }
    }
    if(!eppnExist)
      commenters.push(eppn);
  }
  commenters.forEach((e)=>{
    console.log(e);
  })
  return commenters;
}

//TODO clean up the code
//TODO need to uncheck the prevTarget when a new radio button is clicked on
//TODO need to dynamic add a new commenter if someone new comment the text
function makeCommentersDropDown(commenters){
  $("#commenterSelector").empty();
  commenters.push("AllCommenters");
  let allCommenters = $('<ul/>', {
    class: "allCommenters"
  });

  // let list = $('<li/>', {
  //   class: "commenters"
  // });
  //
  // let radioLabel = $("<label>", {
  //   class: "mdl-radio mdl-js-radio",
  //   id: "SelectorAllCommeters",
  //   name: "commenterSelector",
  //   for: "AllCommenters"
  // });
  //
  // let input = $('<input/>', {
  //   type: "radio",
  //   id: "AllCommenters",
  //   class: "mdl-radio__button",
  // });
  //
  // let spanText = $("<span>", {
  //   class: "mdl-radio__label",
  //   text: "All"
  // });
  //
  // $(list).append(radioLabel);
  // $(radioLabel).append(input, spanText);
  // $(allCommenters).append(list);
  // input.on("click", (evt)=>{
  //   // var prevTarget = $("#commenterSelector").attr("currentTarget");
  //   // $("#"+escapeSpecialChar(prevTarget)).parent().removeClass("is-checked");
  //   var currentSelectedType = $("#loadlist").attr("currentTarget");
  //   var currentSelectedCommenter = evt["currentTarget"]["id"];
  //   $("#commenterSelector").attr('currentTarget',currentSelectedCommenter);
  //   newDropDownSelect(currentSelectedType, currentSelectedCommenter);
  // });
  // componentHandler.upgradeElement($(radioLabel)[0]);
  console.log(commenters.length);
  for(var i = commenters.length-1 ; i >= 0 ;i--){
    var data = commenters[i];
    var eppn = data.split("@")[0];
    let list = $('<li/>', {
      class: "commenters"
    });

    let radioLabel = $("<label>", {
      class: "mdl-radio mdl-js-radio",
      id: "Selector" + data,
      name: "commenterSelector",
      for: "cs_" + data
    });

    let input = $('<input/>', {
      type: "radio",
      id: "cs_" + data,
      class: "mdl-radio__button",
    });

    let spanText = $("<span>", {
      class: "mdl-radio__label",
      text: data.split("@")[0]
    });

    $(list).append(radioLabel);
    $(radioLabel).append(input, spanText);
    $(allCommenters).append(list);
    input.on("click", (evt)=>{
      // var prevTarget = $("#commenterSelector").attr("currentTarget");
      // $("#"+escapeSpecialChar(prevTarget)).parent().removeClass("is-checked");
      var currentSelectedType = $("#loadlist").attr("currentTarget");
      var currentSelectedCommenter = evt["currentTarget"]["id"];
      $("#commenterSelector").attr('currentTarget',currentSelectedCommenter);
      newDropDownSelect(currentSelectedType, currentSelectedCommenter);
    });
    componentHandler.upgradeElement($(radioLabel)[0]);
  }

  // commenters.forEach(function(data) {
  //   var eppn = data.split("@")[0];
  //   let list = $('<li/>', {
  //     class: "commenters"
  //   });
  //
  //   let radioLabel = $("<label>", {
  //     class: "mdl-radio mdl-js-radio",
  //     id: "Selector" + data,
  //     name: "commenterSelector",
  //     for: "cs_" + data
  //   });
  //
  //   let input = $('<input/>', {
  //     type: "radio",
  //     id: "cs_" + data,
  //     class: "mdl-radio__button",
  //   });
  //
  //   let spanText = $("<span>", {
  //     class: "mdl-radio__label",
  //     text: data.split("@")[0]
  //   });
  //
  //   $(list).append(radioLabel);
  //   $(radioLabel).append(input, spanText);
  //   $(allCommenters).append(list);
  //   input.on("click", (evt)=>{
  //     // var prevTarget = $("#commenterSelector").attr("currentTarget");
  //     // $("#"+escapeSpecialChar(prevTarget)).parent().removeClass("is-checked");
  //     var currentSelectedType = $("#loadlist").attr("currentTarget");
  //     var currentSelectedCommenter = evt["currentTarget"]["id"];
  //     $("#commenterSelector").attr('currentTarget',currentSelectedCommenter);
  //     newDropDownSelect(currentSelectedType, currentSelectedCommenter);
  //   });
  //   componentHandler.upgradeElement($(radioLabel)[0]);
  // });
  $('#commenterSelector').append(allCommenters);
  $("#cs\\_AllCommenters").click();
}


highlightText = ({startIndex, endIndex, commentType, eppn, hash} = {}) => {
    let range = rangy.createRange();
    range.selectCharacters(document.getElementById(TEXTSPACE), startIndex, endIndex);
    let area = rangy.createClassApplier("commented-selection", {
        useExistingElements: false,
        elementAttributes: {
            "id": hash,
            "creator": eppn,
            "typeof": commentType,
        }
    });
    area.applyToRange(range);
}

function clickOnComment(commentSpanId , evt){
  $("#replies").empty();
  $("#commentBox").removeAttr("data-replyToEppn");
  $("#commentBox").removeAttr("data-replyToHash");
  $("#commentBox").attr("data-editCommentId","-1");

  let comment_data = JSON.stringify({
      creator: $(".chosenUser").text().split(":")[0],
      work: $(".chosenFile").text(),
      commenter: $("#"+commentSpanId).attr("creator"),
      hash: $("#"+commentSpanId).attr("id"),
  });

  get_comment_chain_API_request(comment_data, commentSpanId);
  evt.stopPropagation();
  displayReplyBox(evt);
  displayCommentBox(evt,commentSpanId);
}

function get_comment_chain_API_request(jsonData, commentSpanId){
  API.request({
      endpoint: "get_comment_chain",
      data: jsonData,
      method: "POST"
  }).then((data) => {
    readThreads(data);
    $("#commentBox").parent().hide();
  });
}

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, parentId = null){
  if (threads.length==0){
    return;
  }
  else{
    for(var i =0; i<threads.length ; i++){
      // also pass the parentId
        createReplies(
          threads[i].eppn,
          threads[i].firstName,
          threads[i].lastName,
          threads[i].startIndex,
          threads[i].endIndex,
          threads[i].visibility,
          threads[i].commentType,
          btoa(threads[i].commentText),
          threads[i].threads,
          threads[i].hash,
          parentId
        );
      readThreads(threads[i].threads, threads[i].hash);
    }
  }
}


function removeDeletedSpan(id){
  $("#"+id).contents().unwrap();
}

function refreshDropDownSelect(hash, type){
  console.log(type);
  $("#"+hash).attr("typeof",type);
  var currentSelectedType = $("#loadlist").attr("currentTarget");
  var currentSelectedCommenter = $("#commenterSelector").attr("currentTarget");
  //reselect the type selector
  $("#button"+currentSelectedType).removeClass("is-checked");
  $("#button"+type).addClass("is-checked");
  $("#loadlist").attr("currentTarget",type);
  //dropDownSelect(type);
  newDropDownSelect(type,currentSelectedCommenter);
}

function refreshReplyBox(creator,work,commenter,hash){
  //console.log(creator,work,commenter,hash);
  $("#replies").empty();
  let comment_data = JSON.stringify({
      creator: creator,
      work: work,
      commenter: commenter,
      hash: hash
  });
  get_comment_chain_API_request(comment_data, hash);
}

function launchToastNotifcation(data){
    $("#toast-notification").addClass("show");
    $("#notification-data").html(data);
    setTimeout(function(){
      $("#toast-notification").removeClass("show");
      $("#notification-data").empty();
    }, 3000);
}

//fucntions that were made by ppl before
//------------------------------------------------------------------------------

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
  $("[aria-describedby='replies']").hide();
  $("[aria-describedby='commentBox']").hide();
}
