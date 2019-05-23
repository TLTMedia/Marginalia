var API;
var TEXTSPACE = "textSpace";

var currentUser = {};
/**
 * Ends the temporarily known, necessary globals
 */
// Adminstrative helpers, first of multiple checks
var whitelist = []; // the admins of the website, double checked in PHP
var idName = [0]; // The name and id of the span clicked on

// Holds comment and reply information
// var userComMap = new Map(); // id and map of user comments
// var userReplyMap = new Map(); // id and map of user replies
// var adminApproveMap = new Map(); // map of admin approved comments
// var commentIndexMap = new Map(); // map of start/end index of comments
// var commentTypeMap = new Map(); // map of comment types
// var allModeratedPages; // All pages that have moderation
// var allUserComments; // All comments within this text
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
  }).on("mouseup", function(evt) {
    highlightCurrentSelection(evt).then(function(data) {});
    //TODO put this here temporary

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

        let list = $('<li/>', {
          class: "button"
        });

        let radioLabel = $("<label>", {
          class: "mdl-radio mdl-js-radio",
          id: "button" + type,
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

        input.on("click", event => {
          $(".active").removeClass("active");
          $(this).parent().addClass("active");
          //$(".commented-selection[typeof='" + $(this).attr("id").toLowerCase() + "']").css({"background-color": "rgba()"})
          let attributeType = event["currentTarget"]["id"];
          if (attributeType == "All") {
            $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
          } else {
            $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 0.0)"});
            $(".commented-selection[typeof='" + attributeType + "' i]").css({"background-color": "rgba(100, 255, 100, 1.0)"});
          }
        });
        componentHandler.upgradeElement($(radioLabel)[0]);
      }
    })
  }

  if ($(".allButtons").length == 0) {
    $('#loadlist').append(allButtons);
  }
  $(".commentTypeDropdown").val(buttonTypes[0]);

  $("[id='All']").click();
  $("[id='All']").parent().addClass("active");
}

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

    $(".commented-selection").off().on("click", function(evt) {
      var commentSpanId = $(this).attr('id');
      console.log(commentSpanId);
      clickOnComment(commentSpanId, evt);
    });
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

  get_comment_chain_API_request(comment_data, commentSpanId, evt);
}

function get_comment_chain_API_request(jsonData, commentSpanId, evt){
  API.request({
      endpoint: "get_comment_chain",
      data: jsonData,
      method: "POST"
  }).then((data) => {
    if(evt){
      evt.stopPropagation();
      displayReplyBox(evt);
      displayCommentBox(evt,commentSpanId);
    }
      readThreads(data);
      $("#commentBox").parent().hide();
      $(".replies").off().on("click",function(evt){
        evt.stopPropagation();
        var rid = $(this).attr('commentid');
        clickOnReply(rid);
      });
  });
}

function clickOnReply(rid){
  console.log(rid);
  var replyToEppn = $(".replies" + "[commentid = '"+rid+"']").attr('name');
  $("#commentBox").attr("data-replyToEppn", replyToEppn);
  $("#commentBox").attr("data-replyToHash", rid);
  $("#commentSave").show();
  //if the user who clicked is the same as the user who written the reply
  //check if this is a deleted comment
  if($(".replies" + "[commentid = '"+rid+"']").attr('flname')=="deleteddeleted"){
    $(".commentButton").hide();
  }
  else{
    $("#replies").find(".editComments").hide();
    $("#replies").find(".deleteComments").hide();
    if (currentUser.eppn == replyToEppn) {
      $(".editComments" + "[commentid = " + rid + "]").show();
      $(".deleteComments" + "[commentid = " + rid + "]").show();
    }
    CKEDITOR.instances.textForm.setReadOnly(false);
  }
}

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, parentId = null){
  if (threads.length==0){
    return;
  }
  else{
    for(var i =0; i<threads.length ; i++){
      // also pass the parentId
        showReply(
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
      //console.log(threads[i].commentText);
      //console.log(parentId);
      readThreads(threads[i].threads, threads[i].hash);
    }
  }
}

function escapeHTMLPtag(text){
  return text.replace(/<p>(.*)<\/p>/,` $1\n`);
}
// the parentHash is the parent's id (default null)
function showReply(eppn, firstName, lastName, startDex, endDex, isVisible, type, commentText, threads, hash, parentHash = null) {
  var replyBox = $('<div/>', {
    class: "replies",
    commentid: hash,
    name: eppn,
    haschild:0,
    flname:firstName+lastName,
    type:type,
  });
  var userName = firstName + " " + lastName;
  var hashForReply = 'r'+hash;
  var hashForReplyButton = 'b'+hash;
  var inText = atob(commentText);
  inText = escapeHTMLPtag(inText);
  if(firstName == 'deleted' && lastName == 'deleted'){
    //if the comment is deleted then it don't have buttons <span>
    replyBox.html("<span class = 'replyText' id = '"+hashForReply+"'>"+inText+"</span>");
  }else{
    replyBox.html("<span class = 'replyText' id = '"+hashForReply+"'>"+userName + ": " +inText+"</span> <span class = 'commentButtonSpan' id = '"+hashForReplyButton+"'></span>");
  }

  var [replyComment, editComment,deleteComment]=[
    {
        text:"Reply",
        class:"replyToComments",
        click:function(){
          replyButtonOnClick();
        }
      },{
          text:"Edit",
          class:"editComments",
          click:function(){
            editButtonOnClick(inText,hash);
          }
      },
      {
          text:"Delete",
          class:"deleteComments",
          creatorEppn:eppn,
          click:function(){
            deleteButtonOnClick(hash,eppn,hashForReply);
          }
        }
  ].map((buttonData)=>$("<button/>",Object.assign(buttonData,{commentId:hash})));
  // this reply has a parent
  if (parentHash != null) {
    //if this is a deleted comment
    $(".replies"+"[commentid = '"+parentHash+"']").append(replyBox);
    $(".replies"+"[commentid = '"+parentHash+"']").attr("haschild","1");
    //console.log($("#"+hash+".replies").children());
    $("#"+hashForReplyButton).append(replyComment, editComment, deleteComment);
    // hide the dev if the current comment is a deleted comment
    if(firstName == 'deleted' && lastName == 'deleted'){
      $(".replies"+"[commentid = '"+hash+"']").hide();
    }
    //shows the deleted reply if it has a child
    if($(".replies"+"[commentid = '"+parentHash+"']").attr("haschild") == 1){
      $(".replies"+"[commentid = '"+parentHash+"']").show();
    }
  }
  // this reply doesn't have a parent
  else {
    $("#replies").append(replyBox);
    $("#"+hashForReplyButton).append(replyComment, editComment, deleteComment);
  }
  // hide all the buttons except the reply button
  $(".editComments"+"[commentid = '"+hash+"']").hide();
  $(".deleteComments"+"[commentid = '"+hash+"']").hide();
  $(".replyToComments"+"[commentid = '"+hash+"']").show();
}

function replyButtonOnClick(){
  CKEDITOR.instances.textForm.setData("");
  // change the attr editCommentID to -1 for the save button to check if this is a edit or reply
  //$("#commentBox").attr("editCommentID","-1");
  $("#commentBox").attr("data-editCommentID", "-1");
  console.log("work");
  $("#commentBox").parent().show();
}

function editButtonOnClick(inText,hash){
  //add the attribute editCommentID to the textEditor div for save button to check if this is a edit or a reply
  $("#commentBox").attr("data-editCommentID",hash);
  //$("[class = 'ui-dialog ui-corner-all ui-widget ui-widget-content ui-front no-close ui-dialog-buttons ui-draggable ui-resizable']").show();
  $("#commentBox").parent().show();
  CKEDITOR.instances.textForm.setData(inText);
  var editCommentID = $("#commentBox").attr("editcommentid");
  //TODO the type sould be reply
  if($(".replies"+"[commentid = '"+editCommentID+"']").attr('type')!= '_'){
    $('.commentTypeDropdown').removeAttr('disabled');
  }
}

function deleteButtonOnClick(hash,eppn,hashForReply){
  var literatureName = $(".chosenFile").text();;
  var data = getDataForEditOrDelete(literatureName,hash,eppn,null,null);
  editOrDelete(data,false);
  //This is for changing the replybox immediately after the delete button was clicked
}


// This displays the comment box in a position near where the user ends their hl
function displayCommentBox(evt,id) {
  // console.log($(document).height());
  // console.log("Mouse Pos: " + evt.clientX, evt.clientY + "\nScroll Position: " + $(window).scrollTop());
  var newLeft = (width * .55) + "px";
  var newTop = (evt.pageY - 100) + "px";

  if (evt.pageY + 300 > $(document).height()) {
    newTop = $(document).height() - 300 + "px";
  } else if ((evt.pageY - 100) < 0) {
    newTop = "0px";
  }
  $("#commentBox").parent().css({
    'top': newTop,
    'left': newLeft
  })

  $("#commentBox").attr("data-firstCommentId",id);
  $("#commentBox").parent().show();
}

// This displays the replies for the current comment box
function displayReplyBox(evt) {
  if($("#replies").parent().find(".closeReplyBox").length != 0){
    $("#replies").parent().find(".closeReplyBox").remove();
  }
  var newTop = evt.pageY + "px";

  var newLeft = width * .55 + "px";

  $("#replies").parent().css({
    'top': newTop,
    'left': newLeft
  })

  $("#replies").parent().show();
  var closeReplyBox =  $("<button/>",{
      text:"X",
      class:"closeReplyBox",
      click:function(){
          $("#replies").parent().hide();
          $("#replies").parent().css("z-index","0");
          $("#commentBox").parent().css("z-index","1");
      }
    });
  $("#replies").parent().find("#ui-id-2").prepend(closeReplyBox);
  $(".closeReplyBox").parent().css({position: 'relative'});
  $(".closeReplyBox").css({top: 0, left: 0, position:'absolute'});
}

// This is the box that will house the various replies a comment thread may hold
function makeDraggableReplyBox() {
  console.log(($("#replies").length))
  if ($("#replies").length){
  $("#replies").dialog({
    dialogClass: "no-close",
    use: 'reply',
    modal: true,
    width: 500,
    title: "Comments"
  });
  }
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
          click: function(){
            saveButtonOnClick();
          }
        },
        {
          text: "Exit",
          id: "commentExit",
          click: function() {
            exitButtonOnClick();
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
    CKEDITOR.replace('textForm');
  }
}

function saveButtonOnClick() {
  var commentText = CKEDITOR.instances.textForm.getData();
  console.log(commentText.replace(/<p>(.*)<\/p>/g,`$1`).replace(/\s/g,"").replace(/&nbsp;/g,""));
  var isTextAreaEmpty = commentText.replace(/<p>(.*)<\/p>/g,`$1`).replace(/\s/g,"").replace(/&nbsp;/g,"").length;
  if (!isTextAreaEmpty) {
    launchToastNotifcation("Please put in some comment before you save");
  //alert("Please put in some comment before you save");
  }
  else {
    // if it is neither then it goes forwards with the save
    // If this is a reply to a comment then it saves the reply
    // otherwise it is a comment save/edit
    var literatureName = $(".chosenFile").text();
    var commentType = $(".commentTypeDropdown").val();
    var span = $("." + escapeEPPN(remSpan));
    console.log(remSpan);
    var replyTo = $("#commentBox").attr("data-replytoeppn");
    var replyHash = $('#commentBox').attr("data-replytohash");
    var dataForSave = getDataForSave(literatureName,commentText,commentType,span,replyTo,replyHash)
    //console.log(dataForSave);

    var editCommentID = $("#commentBox").attr("data-editCommentID");
    if(editCommentID!="-1"){
      var commentCreatorEppn = $(".replies"+"[commentid = '"+editCommentID+"']").attr('name');
      var commentType;
      //check if this is a coment or reply (reply will not have a type)
      if($(".replies"+"[commentid = '"+editCommentID+"']").attr('type')){
        commentType = $('.commentTypeDropdown').children("option:selected").val();
      }
      else{
        commentType = null;
      }
      var dataForEdit = getDataForEditOrDelete(literatureName,editCommentID,commentCreatorEppn,commentType,commentText,true);
      //console.log(dataForEdit);
      editOrDelete(dataForEdit,true);
      $("#commentBox").attr('data-editCommentID','-1');
      $("#commentBox").parent().hide();
    }
    //check if the replyToEppn is undefined to see if this is a reply or not
    else if ($("#commentBox").attr("data-replyToEppn")) {
      saveCommentOrReply(dataForSave,false);
      $("#commentBox").parent().hide();
    }
    else{
      console.log("Saved As Comment");
      saveCommentOrReply(dataForSave,true);
      $("#commentBox").parent().hide();
    }
  }
}


function exitButtonOnClick(){
  CKEDITOR.instances.textForm.setData("");
  //TODO remove the hl_eppn spans by a way that don't require the global variable
  //TODO don't need to get the eppn
  var x = "hl_" + currentUser.eppn;
  $("."+escapeEPPN(x)).contents().unwrap();
  $("#commentBox").parent().hide();
  //$("#replies").parent().hide();
}

//return a dictionary with the data we need to save
function getDataForSave(literatureName,commentText,commentType,span,replyTo,replyHash){
  var dataForSave = {
    author: $(".chosenUser").text().split(":")[0],
    work: literatureName,
    commentText: commentText,
    commentType: commentType,
    startIndex:(span.attr("startIndex")? span.attr("startIndex") :null),
    endIndex:(span.attr("endIndex")? span.attr("endIndex") :null),
    replyTo:(replyTo? replyTo:null),
    replyHash:(replyHash? replyHash:null),
    visibility: true
  }
  return dataForSave;
}

//TODO find out how the comment highlight is stored
function saveCommentOrReply(dataForSave,isComment){
  let savedData = JSON.stringify({
      author: dataForSave["author"],
      work: dataForSave["work"],
      replyTo: dataForSave["replyTo"], // if it's a comment to a comment...
      replyHash: dataForSave["replyHash"], // ^ (no backend exists for this yet)
      startIndex: dataForSave["startIndex"],
      endIndex: dataForSave["endIndex"],
      commentText: dataForSave["commentText"],
      commentType: isComment?dataForSave["commentType"]:null, // if this is saving reply type will be null
      visibility: dataForSave["visibility"]
  });
  API.request({
      method: "POST",
      endpoint: "save_comments",
      data: savedData,
      callback: launchToastNotifcation
  });
  if(!isComment){
    var firstCommentId = $("#commentBox").attr("data-firstCommentId");
    refreshReplyBox(dataForSave["author"],dataForSave["work"],$("#"+firstCommentId).attr("creator"),firstCommentId);
  }
  else{
    //TODO can't update immediately after saveing the first comment
    loadUserComments();
  }
}

function getDataForEditOrDelete(literatureName,hash,commentCreatorEppn,commentType,commentText){
  var common = {
    creator: $(".chosenUser").text().split(":")[0],
    work: literatureName,
    commenter: commentCreatorEppn,
    hash: hash
  }
  var editData={
    type: commentType,
    text: commentText,
    public: true
  }
  var dataForEditOrDelete = Object.assign({},common,editData);
  return dataForEditOrDelete;
}

function editOrDelete(dataForEditOrDelete,isEdit){
  var data;
  var endPoint;
  var commonData = {
    creator:dataForEditOrDelete["creator"],
    work:dataForEditOrDelete["work"],
    commenter:dataForEditOrDelete["commenter"],
    hash:dataForEditOrDelete["hash"]
  };
  if(isEdit){
    endPoint = "edit_comment";
    var editData = {
      type: dataForEditOrDelete["type"],
      text: dataForEditOrDelete["text"],
      public: dataForEditOrDelete["public"]
    };
    $.extend(commonData,editData);
  }
  else{
    endPoint = "delete_comment";
  }
  data = JSON.stringify(commonData);
  console.log(data);
  API.request({
    endpoint:endPoint,
    method: "POST",
    data: data,
    callback: launchToastNotifcation
  });
  var firstCommentId = $("#commentBox").attr("data-firstCommentId");
  refreshReplyBox(dataForEditOrDelete["creator"],dataForEditOrDelete["work"],$("#"+firstCommentId).attr("creator"),firstCommentId);
}

function refreshReplyBox(creator,work,commenter,hash){
  console.log(creator,work,commenter,hash);
  $("#replies").empty();
  let comment_data = JSON.stringify({
      creator: creator,
      work: work,
      commenter: commenter,
      hash: hash
  });
  get_comment_chain_API_request(comment_data, hash, null);
}

function launchToastNotifcation(data){
    $("#toast-notification").addClass("show");
    $("#notification-data").html(data);
    setTimeout(function(){
      $("#toast-notification").removeClass("show");
      $("#notification-data").empty();
    }, 3000);
}



// //TODO pass in the data instead of getting it from global
// function saveUserComment() {
//   // double check if the send comment comes from admin access
//
//   //var timeSt = Math.floor(Date.now() / 1000).toString(16);
//   var inText = CKEDITOR.instances.textForm.getData();
//
//   var span = $("." + escapeEPPN(remSpan));
//   var type = $(".commentTypeDropdown").val();
//   if (type == null) {
//     type = "historical";
//   }
//   type = type.toLowerCase();
//
//   // Sending information
//
//   CKEDITOR.instances.textForm.setData("");
//   var startIndex = span.attr("startIndex");
//   var endIndex = span.attr("endIndex");
//   var literatureName = $(".chosenFile").text();
//   console.log(literatureName);
//   let comment_data = JSON.stringify({
//       author: $(".chosenUser").text().split(":")[0],
//       work: literatureName,
//       replyTo: null, // if it's a comment to a comment...
//       replyHash: null, // ^ (no backend exists for this yet)
//       startIndex: startIndex,
//       endIndex: endIndex,
//       commentText: inText,
//       commentType: type,
//       visibility: true// TODO: user option when posting
//   });
//
//   API.request({
//       method: "POST",
//       endpoint: "save_comments",
//       data: comment_data,
//       callback:(mydata)=>{alert(mydata)}
//   })
// }
//
// // Saves a user's reply to a thread
// function saveUserReply(literatureName,replyTo,replyHash,commentText) {
//   console.log("call saveUserReply()");
//   let reply_data = JSON.stringify({
//     author: $(".chosenUser").text().split(":")[0],
//     work: literatureName,
//     replyTo: replyTo,
//     replyHash: replyHash,
//     startIndex: null,
//     endIndex: null,
//     commentText: commentText,
//     commentType: null,
//     visibility: true
//   });
//   API.request({
//       endpoint: "save_comments",
//       method: "POST",
//       data: reply_data,
//       callback:alert
//   })
// }
// function saveEditComment(literatureName,hash,commentCreatorEppn,commentType,commentText){
//   console.log('called saveEditComment');
//   let editData = JSON.stringify({
//     creator: $(".chosenUser").text().split(":")[0],
//     work: literatureName,
//     commenter: commentCreatorEppn,
//     hash: hash,
//     type: commentType,
//     text: commentText,
//     public: true // set the comment to public or private... default is public
//   });
//
//   API.request({
//     endpoint: "edit_comment",
//     method: "POST",
//     data: editData,
//     callback:alert
//   });
// }
//
// function deleteUserComment(hash,commentCreatorEppn){
//   console.log("call deleteUserComment");
//   var literatureName = $(".chosenFile").text();
//   let deleteData = JSON.stringify({
//     creator: $(".chosenUser").text().split(":")[0],
//     work: literatureName,
//     commenter: commentCreatorEppn,
//     hash: hash
//   });
//
//   API.request({
//     endpoint: "delete_comment",
//     method: "POST",
//     data: deleteData,
//     callback:alert
//   });
// }





//fucntions that is made by ppl before
//------------------------------------------------------------------------------

//TODO have to hide the replies and commentBox in some way
// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
  $("[aria-describedby='replies']").hide();
  $("[aria-describedby='commentBox']").hide();
  $("[aria-describedby='choices']").hide();
}

// When a user clicks to show the replies the comment box is displayed
// So that they can view the comment they're replying to
function textShowReply() {
  var position = $("#replies").parent().css("top");
  position = parseInt(position.substring(0, position.length - 2));
  position = (position -325);
  if (position < 0) {
    $("#replies").parent().css({
      "top": -(position) + 200 + "px"
    });
    position = 0;
  }
  $("#commentBox").parent().css({
    "top": position + "px"
  });
  $("#commentSave").hide();
  $("#commentRemove").hide();
  $("#commentExit").show();

  CKEDITOR.instances['textForm'].setReadOnly(true);

  $(".commentTypeDropdown").attr("disabled", "disabled");
}

// // opens the commentBox in order for a reply to be made
// function comBoxReply(evt) {
//   CKEDITOR.instances.textForm.setData("");
//   $(".commentTypeDropdown").hide()
//   //$("#commentRemove").hide()
//   $("id[ui-id-1]").text("Reply by: " + currentUser.fullname);
//
//   var newTop = evt.pageY + "px";
//
//   var newLeft = width * .50 + "px";
//
//   if (!$("div[aria-describedby='commentBox']").is(":visible")) {
//     $("div[aria-describedby='commentBox']").css({
//       'top': newTop,
//       'left': newLeft,
//     });
//
//     $("div[aria-describedby='replies']").css({
//       'top': evt.pageY,
//       'left': "5%",
//     });
//   }
//
//   $("div[aria-describedby='commentBox']").show();
//   $("div[aria-describedby='replies']").show();
//
//
//
//   isReply = true;
// }
