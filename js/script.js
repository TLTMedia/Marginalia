var API;
var TEXTSPACE = "textSpace";


var currentUser = {};
// Adminstrative helpers, first of multiple checks
var whitelist = []; // the admins of the website, double checked in PHP

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
  //createSettingScreen({users:users});

  $(window).on("resize", function() {
    var stageWidth = $(window).width();
    $("#text").css("height", $("#litDiv").height() + "px");
    $("html").css("font-size", (stageWidth / 60) + "px");
  }).trigger("resize")


  $.address.externalChange((evt)=>{
    console.log("externalChange");
    loadFromDeepLink();
  });

}

// Creates a visual list of all users which gives access to their folders
/*
  Loads the user's works folder and creates a button for each work they have
  When the button is clicked the variable userFolderSelected is the work's name
  The cooresponding work then has it's text and comment/reply data loaded
*/
function buildHTMLFile(litContents, selected_eppn,textChosen) {
  // TODO check this logic
  if (!$(".commentTypeDropdown").length) {
    //TODO make drop down combine with commentbox
    makeDropDown();
    makeDraggableCommentBox(selected_eppn,textChosen);
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
    dropdown.append(option);
    $("#commentTypeDropdown").val(option);
  });
}

//TODO need the author and the work name to enable the click event for the comments
//TODO use a better way to store the work and author instead of getting it from DOM
function selectorOnSelect(currentSelectedType, currentSelectedCommenter){
  // console.log('type : ',currentSelectedType);
  // console.log('commenter: ',currentSelectedCommenter);
  let selectedComments;
  $(".commented-selection").off().css({
    "background-color": "rgba(100, 255, 100, 0.0)"
  });
  if (currentSelectedType == "All" && currentSelectedCommenter == "AllCommenters"){
    selectedComments = $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedCommenter == "AllCommenters"){
    selectedComments = $(".commented-selection" + "[typeof='" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else if(currentSelectedType == "All"){
    selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  else{
    selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "'][typeof = '" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
  }
  selectedComments.off().on("click",(evt)=>{
    let commentSpanId = evt["currentTarget"]["id"];
    let work = $("#setting").attr("work");
    let author = $("#setting").attr("author");
    clickOnComment(commentSpanId,work,author,evt);
  });
  markUnapprovedComments(currentSelectedType,currentSelectedCommenter);
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
  let endpoint = "get_highlights/" + selected_eppn + "/" + textChosen;
  API.request({endpoint}).then((data) => {
      console.log(data);
      renderComments(data,selected_eppn,textChosen);
      makeSelector(createListOfCommenter(data),colorNotUsedTypeSelector);
  });
}

renderComments = (commentData, selected_eppn,textChosen) => {
    $("#text").fadeIn();
    $("#textSpace").fadeIn();
    $("#textTitle").fadeIn();
    console.log(selected_eppn);
    for (let i = 0; i < commentData.length; ++i) {
        highlightText({
            startIndex: commentData[i].startIndex,
            endIndex: commentData[i].endIndex,
            commentType: commentData[i].commentType,
            eppn: commentData[i].eppn,
            hash: commentData[i].hash,
            approved: commentData[i].approved
        });
    }
    $("#text").css("height", $("#litDiv").height() + "px");
    //highlight to post comments
    $("#litDiv").on("mouseup", function(evt) {
      highlightCurrentSelection(evt);
    });
    // click on comment to reply the post
    $(".commented-selection").off().on("click", function(evt) {
      var commentSpanId = $(this).attr('id');
      clickOnComment(commentSpanId,textChosen,selected_eppn,evt);
    });
}

function markUnapprovedComments(type,commenter){
  //change everything to color black
  $(".commented-selection").css({"color" : "black"});
  let unapprovedCommentsId =[];
  let unapprovedComments;
  if(commenter == "AllCommenters"){
    if(type == "All"){
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"]");
    }
    else{
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][typeof = '"+type+"']");
    }
  }
  else{
    if(type == "All"){
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][creator = '"+commenter+"']");
    }
    else{
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][typeof = '"+type+"'][creator = '"+commenter+"']");
    }
  }
  for(var i = 0; i < unapprovedComments.length; i++){
    let id = unapprovedComments[i]["attributes"]["id"]["value"];
    unapprovedCommentsId.push(id);
  }
  unapprovedCommentsId.forEach((element)=>{
    $("#"+element).css({"color" : "red"});
  });
}

function createListOfCommenter(data){
  var commenters=[];
  if(data.length){
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
  }
  return commenters;
}

function makeSelector(commenters,callback){
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
  callback();
}

function makeTypeSelector(buttonTypes) {
  $("#loadlist").empty();
  let allTypes = $('<ul/>', {
    class: "allTypes"
  });

  let selectorHeader = $('<li>',{
    class: "selectorHeader",
    text: "Filter By:"
  });
  $(allTypes).append(selectorHeader);
  buttonTypes.forEach(function(type) {
    let list = makeSelectorOptions(type,'typeSelector');
    $(allTypes).append(list);
  });
  $('#loadlist').append(allTypes);
  $("#All").click();
}

function makeCommentersSelector(commenters){
  $("#commenterSelector").empty();
  commenters.unshift("AllCommenters");
  let allCommenters = $('<ul/>', {
    class: "allCommenters"
  });

  let selectorHeader = $('<li>',{
    class: "selectorHeader",
    text: "Filter By:"
  });
  $(allCommenters).append(selectorHeader);
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


highlightText = ({startIndex, endIndex, commentType, eppn, hash , approved} = {}) => {
    let range = rangy.createRange();
    range.selectCharacters(document.getElementById(TEXTSPACE), startIndex, endIndex);
    let area = rangy.createClassApplier("commented-selection", {
        useExistingElements: false,
        elementAttributes: {
            "id": hash,
            "creator": eppn,
            "typeof": commentType,
            "approved": approved
        }
    });
    area.applyToRange(range);
}

//if current user is admin for the current work, they are able to approve the unapproved comments
//if current user is creator of the comment, they are able to edit and delete the unapproved comment
//approved comments don't need to check anyPermission stuff
function clickOnComment(commentSpanId,workChosen,workCreator,evt){
  $("#replies").empty();
  $("#commentBox").removeAttr("data-replyToEppn");
  $("#commentBox").removeAttr("data-replyToHash");
  $("#commentBox").attr("data-editCommentId","-1");

  let comment_data = {
      creator: workCreator,
      work: workChosen,
      commenter: $("#"+commentSpanId).attr("creator"),
      hash: commentSpanId,
  };
  get_comment_chain_API_request(comment_data,commentSpanId);
  evt.stopPropagation();
  displayReplyBox(evt);
  displayCommentBox(evt,commentSpanId);
}

function get_comment_chain_API_request(jsonData, commentSpanId){
  let work = jsonData.work;
  let workCreator = jsonData.creator;
  let jsonDataStr = JSON.stringify(jsonData);
  API.request({
      endpoint: "get_comment_chain",
      data: jsonDataStr,
      method: "POST"
  }).then((data) => {
    console.log(data);
    readThreads(data,work,workCreator);
    $("#commentBox").parent().hide();
  });
}

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, work, workCreator, parentId = null){
  if (threads.length==0){
    return;
  }
  else{
    for(var i =0; i<threads.length ; i++){
      //TODO make it pass a object instead of every thing
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
          threads[i].approved,
          parentId,
          work,
          workCreator
        );
      readThreads(threads[i].threads,work,workCreator,threads[i].hash);
    }
  }
}

function colorNotUsedTypeSelector(){
  var comments = $("#text").find(".commented-selection");
  let key = ["Historical","Analytical","Comment","Definition","Question"];
  let buttonTypes = {
    "Historical":0,
    "Analytical":0,
    "Comment":0,
    "Definition":0,
    "Question":0
  };
  for(var i = 0;i < comments.length; i++){
    let type = comments[i]["attributes"]["typeof"]["value"];
    buttonTypes[type] +=1;
  }
  key.forEach((element)=>{
    if(buttonTypes[element]==0){
      $("#button"+element).addClass("notUsedType");
    }
    else{
      $("#button"+element).removeClass("notUsedType");
    }
  });
}

// hash is not needed if the comment is deleted
function updateTypeSelector(hash, type){
  if(hash != "undefined"){
    $("#"+hash).attr("typeof",type);
  }
  var currentSelectedType = $("#loadlist").attr("currentTarget");
  var currentSelectedCommenter = $("#commenterSelector").attr("currentTarget");
  //reselect the type selector
  $("#button"+currentSelectedType).removeClass("is-checked");
  $("#button"+type).addClass("is-checked");
  $("#loadlist").attr("currentTarget",type);
  selectorOnSelect(type,currentSelectedCommenter);
  //update the notUsedType
  colorNotUsedTypeSelector();
}

function refreshReplyBox(creator,work,commenter,hash){
  $("#replies").empty();
  let comment_data = {
      creator: creator,
      work: work,
      commenter: commenter,
      hash: hash
  };
  get_comment_chain_API_request(comment_data, hash);
}


// this function only check if the selected_eppn is same as the current user or not
function checkCurrentUserPermission(selected_eppn,needNotification){
  console.log(selected_eppn)
  if(selected_eppn == currentUser.eppn){
    return true;
  }
  else{
    if(needNotification){
      launchToastNotifcation("You don't have permission to do this action");
    }
    return false;
  }
}

//TODO this only blocks the Setting button:    mode = setting, mode = approvedComments
//need to update this function with other things that need to check if user is in whiteList
//ex: approve comments
function checkworkAdminList(selected_eppn,litId,mode){
  var endPoint = "get_permissions_list/"+selected_eppn+"/"+litId;
  API.request({
    endpoint: endPoint,
    method: "GET"
  }).then((data)=>{
    let isInWhiteList = false
    for (var i =0; i<data["admins"].length;i++){
      if(currentUser.eppn == data["admins"][i]){
        isInWhiteList = true;
        console.log(currentUser.eppn," in admins");
      }
    }
    if(!isInWhiteList){
      if(mode == "setting"){
        $("#setting").addClass("noPermission");
      }
      else if(mode == "approvedComments"){
        $("#replies").attr("isCurrentUserAdmin",false);
      }
    }
    else{
      if(mode == "setting"){
        $("#setting").removeClass("noPermission");
      }
      else if(mode == "approvedComments"){
        $("#replies").attr("isCurrentUserAdmin",true);
      }
    }
  });
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
