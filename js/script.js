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
  loadFromDeepLink();
}

// Creates a visual list of all users which gives access to their folders
/*
  Loads the user's works folder and creates a button for each work they have
  When the button is clicked the variable userFolderSelected is the work's name
  The cooresponding work then has it's text and comment/reply data loaded
*/
function buildHTMLFile(litContents, selected_eppn,textChosen) {
  if (!$(".commentTypeDropdown").length) {
    makeDropDown();
    makeDraggableCommentBox();
    makeDraggableReplyBox();
    hideAllBoxes();
  }
  loadUserComments(selected_eppn,textChosen);

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


  var preText = $("<div/>", {
    "id": "textSpace"
  });

  preText.html(litContents);

  litDiv.append(metaChar, metaName, link, script, preText);
  $("#text").append(litDiv);
}

function makeDropDown(){
  let buttonTypes = ['Historical','Analytical','Comment','Definition','Question'];
  dropdown = $("<select>", {
    class: "commentTypeDropdown",
  });
  buttonTypes.forEach((type)=>{
    var option = $("<option>", {
      name: type,
      text: type
    });
    if ($("#commentTypeDropdown").length == 0) {
      dropdown.append(option);
      $("#commentTypeDropdown").val(option);
    }
  });
}

function selectorOnSelect(currentSelectedType, currentSelectedCommenter){
  console.log('type : ',currentSelectedType);
  console.log('commenter: ',currentSelectedCommenter);
  $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 0.0)"});
  if (currentSelectedType == "All" && currentSelectedCommenter == "AllCommenters"){
    $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedCommenter == "AllCommenters"){
    $(".commented-selection" + "[typeof='" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedType == "All"){
    $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else{
    $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "'][typeof = '" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
}

// Load the user's comments after a work button is clicked
/*
  Fills the 3 comment variables with the comment/reply data
  Each is mapped with its cooresponding Hex-Encoded UNIX timestamp
  The student selection menu is filled with each student's netid
*/
loadUserComments = (selected_eppn,textChosen) => {
  $("#text").hide();
  $("#textSpace").hide();
  $("#textTitle").hide();
  $(".loader").show();
  //TODO get rid of textChosen
  let endpoint = "get_highlights/" + selected_eppn + "/" + textChosen;
  API.request({endpoint}).then((data) => {
      renderComments(data);
      makeSelector(createListOfCommenter(data));
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

function makeSelector(commenters){
  let buttonTypes = [
    'All',
    'Historical',
    'Analytical',
    'Comment',
    'Definition',
    'Question'
  ];
  makeTypeSelector(buttonTypes);
  makeCommentersSelector(commenters);
}

function makeTypeSelector(buttonTypes) {
  $("#loadlist").empty();
  let allButtons = $('<ul/>', {
    class: "allButtons"
  });

  buttonTypes.forEach(function(type) {
    let list = makeSelectorOptions(type,'typeSelector');
    $(allButtons).append(list);
  });
  $('#loadlist').append(allButtons);
  $("#All").click();
}

function makeCommentersSelector(commenters){
  $("#commenterSelector").empty();
  commenters.unshift("AllCommenters");
  let allCommenters = $('<ul/>', {
    class: "allCommenters"
  });
  commenters.forEach((data)=>{
    let list = makeSelectorOptions(data,'commenterSelector');
    $(allCommenters).append(list);
  });
  $('#commenterSelector').append(allCommenters);
  $("#AllCommenters").click();
}

function makeSelectorOptions(option,mode){
  let data = option;
  let name;
  let text;
  if(mode == 'commenterSelector'){
    name = 'commenterSelector';
    text = data.split("@")[0];
  }
  else if (mode == 'typeSelector'){
    name = 'typeSelector';
    text = data;
  }

  let list = $('<li/>', {
    class: "buttons"
  });

  let radioLabel = $("<label>", {
    class: "mdl-radio mdl-js-radio",
    id: "button" + data,
    for: data
  });

  let input = $('<input/>', {
    type: "radio",
    id: data,
    name: name,
    class: "mdl-radio__button",
  });

  let spanText = $("<span>", {
    class: "mdl-radio__label",
    text: text
  });

  $(list).append(radioLabel);
  $(radioLabel).append(input, spanText);
  input.on("click", (evt)=>{
    console.log(evt);
    let currentSelectedType;
    let currentSelectedCommenter;
    if(evt["currentTarget"]["attributes"]["name"]["value"] == 'commenterSelector'){
      currentSelectedType = $("#loadlist").attr("currentTarget");
      currentSelectedCommenter = evt["currentTarget"]["id"];
      $("#commenterSelector").attr('currentTarget',currentSelectedCommenter);
    }
    else if(evt["currentTarget"]["attributes"]["name"]["value"] == 'typeSelector'){
      currentSelectedType = evt["currentTarget"]["id"];
      currentSelectedCommenter = $("#commenterSelector").attr('currentTarget') ? $("#commenterSelector").attr('currentTarget') : 'AllCommenters';
      $("#loadlist").attr('currentTarget',currentSelectedType);
    }
    selectorOnSelect(currentSelectedType, currentSelectedCommenter);
  });
  componentHandler.upgradeElement($(radioLabel)[0]);
  return list;
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

function refreshDropDownSelect(hash, type){
  console.log(type);
  $("#"+hash).attr("typeof",type);
  var currentSelectedType = $("#loadlist").attr("currentTarget");
  var currentSelectedCommenter = $("#commenterSelector").attr("currentTarget");
  //reselect the type selector
  $("#button"+currentSelectedType).removeClass("is-checked");
  $("#button"+type).addClass("is-checked");
  $("#loadlist").attr("currentTarget",type);
  selectorOnSelect(type,currentSelectedCommenter);
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
