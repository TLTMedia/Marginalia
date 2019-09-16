var API;
var TEXTSPACE = "textSpace";


var currentUser = {};
// Adminstrative helpers, first of multiple checks

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
  createWorkTitle(textChosen);

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

function createWorkTitle(textChosen){
  let workTitle = $("<div/>",{
    id: "workTitle"
  });
  let workTitleSpan = $("<span/>",{
    id : "workTitleSpan",
    text: textChosen
  });
  workTitle.append(workTitleSpan);
  $("#text").append(workTitle);
  createTips(workTitle);
}

function createTips(workTitle){
  let tips = $("<div/>",{
    id: "tips"
  });
  let icon = $("<i/>",{
    class: "material-icons tipsIcon",
    text: "help"
  });
  let text = $("<span/>",{
    class: "tipsText"
  });
  text.html("The <span style = 'color : red'>Red</span> comments are the comments that are not approved yet.\nThe <span style = 'color : orange'>Orange</span> comments are comments that have unapproved replies.");
  tips.append(icon,text);
  workTitle.prepend(tips);
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

//selected_eppn : work creator
renderComments = (commentData, selected_eppn,textChosen) => {
    $("#text").fadeIn();
    $("#textSpace").fadeIn();
    $("#textTitle").fadeIn();
    console.log(selected_eppn);
    // let overLapHash = checkOverLapSpans(commentData);
    // let overLapCommentsData =[];
    // for (let i = 0; i < commentData.length; ++i) {
    //   console.log(commentData[i].hash)
    //   for(let j = 0; j< overLapHash.length; j++){
    //     if(commentData[i].hash == overLapHash[j]){
    //       overLapCommentsData.push(commentData[i]);
    //       commentData.splice(i,1);
    //     }
    //   }
    // }
    for(let i = 0; i < commentData.length;i++){
      highlightText({
          startIndex: commentData[i].startIndex,
          endIndex: commentData[i].endIndex,
          commentType: commentData[i].commentType,
          eppn: commentData[i].eppn,
          hash: commentData[i].hash,
          approved: commentData[i].approved
      });
      let comment_data = {
          creator: selected_eppn,
          work: textChosen,
          commenter: commentData[i].eppn,
          hash: commentData[i].hash
      };
      checkThreadUnapprovedComments(comment_data,undefined,undefined,markUnapprovedComments);
    }

    // for(let i = 0; i < overLapCommentsData.length; i++){
    //   console.log(overLapCommentsData)
    //   highlightOverLapText({
    //       startIndex: overLapCommentsData[i].startIndex,
    //       endIndex: overLapCommentsData[i].endIndex,
    //       commentType: overLapCommentsData[i].commentType,
    //       eppn: overLapCommentsData[i].eppn,
    //       hash: overLapCommentsData[i].hash,
    //       approved: overLapCommentsData[i].approved
    //   });
    // }
    $("#text").css("height", $("#litDiv").height() + "px");
    //highlight to post comments
    $("#litDiv").on("mouseup", function(evt) {
      highlightCurrentSelection(evt);
    });


    //highlight on top of other's comment will bring them to the reply box
    $(".commented-selection").off().on("mouseup", function(evt) {
      var commentSpanId = $(this).attr('id');
      clickOnComment(commentSpanId,textChosen,selected_eppn,evt);
    });
    // click on comment to reply the post
    $(".commented-selection").off().on("click", function(evt) {
      var commentSpanId = $(this).attr('id');
      clickOnComment(commentSpanId,textChosen,selected_eppn,evt);
    });
}

function highlightText({startIndex, endIndex, commentType, eppn, hash, approved}){
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
      hash: commentSpanId
  };
  get_comment_chain_API_request(comment_data,commentSpanId);
  evt.stopPropagation();
  displayReplyBox(evt,commentSpanId);
  // displayCommentBox(evt);
  // hideCommentBox();
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
      let dataForReplies = {
        eppn: threads[i].eppn,
        firstName: threads[i].firstName,
        lastName: threads[i].lastName,
        public: threads[i].public,
        type: threads[i].commentType,
        commentText: btoa(threads[i].commentText),
        hash: threads[i].hash,
        approved: threads[i].approved,
        parentId: parentId,
        work: work,
        workCreator: workCreator
      }
      createReplies(dataForReplies);
      readThreads(threads[i].threads,work,workCreator,threads[i].hash);
    }
  }
}

function checkThreadUnapprovedComments(commentData,type,commenter,callback){
  let jsonDataStr = JSON.stringify(commentData);
  API.request({
      endpoint: "get_comment_chain",
      data: jsonDataStr,
      method: "POST"
  }).then((data) => {
    let isThreadApproved = checkIsThreadApprovedHelper(data,commentData.work,commentData.creator);
    if(isThreadApproved == false){
      let targetComment = $("#"+commentData.hash);
      targetComment.addClass("threadNotApproved");
      targetComment.children("span").addClass("threadNotApproved");
      if(!targetComment.children("span").hasClass("commentNotApproved")){
        targetComment.children("span").text("Orange comment means there are unapproved replies");
      }
    }
    else{
      $("#"+commentData.hash).removeClass("threadNotApproved");
    }
    var callBackType = type != undefined ? type : "All";
    var callBackCommenter = commenter != undefined ? commenter : "AllCommenters";
    callback(callBackType,callBackCommenter);
  });
}

function checkIsThreadApprovedHelper(threads, work, workCreator){
  if (threads.length==0){
    return true;
  }
  else{
    let isApproved;
    let isCurrentCommentApproved = true;
    let isChildApproved = true;
    for(var i =0; i<threads.length ; i++){
      if(threads[i].approved == false){
        isCurrentCommentApproved = false;
        break;
      }
      isChildApproved = checkIsThreadApprovedHelper(threads[i].threads,work,workCreator,threads[i].hash);
      if(isChildApproved == false){
        break;
      }
    }
    isApproved = isCurrentCommentApproved && isChildApproved;
    return isApproved;
  }
}

function markUnapprovedComments(type,commenter){
  //change everything to color black
  //$(".commented-selection").css({"color" : "black"});
  console.log(type,commenter);
  let unapprovedThreadCommentsId = [];
  let unapprovedThreadComments;
  let unapprovedCommentsId =[];
  let unapprovedComments;
  if(commenter == "AllCommenters"){
    if(type == "All"){
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"]");
      //only select comments that is approved, the unapproved first comment is going to be in unapprovedComments
      unapprovedThreadComments = $(".commented-selection.threadNotApproved" + "[approved = "+true+"]");
      //$("#text").find(".commented-selection.threadNotApproved" + "[approved = "+true+"]");
    }
    else{
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][typeof = '"+type+"']");
      unapprovedThreadComments = $("#text").find(".commented-selection.threadNotApproved" + "[approved = "+true+"][typeof = '"+type+"']");
    }
  }
  else{
    if(type == "All"){
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][creator = '"+commenter+"']");
      unapprovedThreadComments = $("#text").find(".commented-selection.threadNotApproved" + "[approved = "+true+"][creator = '"+commenter+"']");
    }
    else{
      unapprovedComments = $("#text").find(".commented-selection" + "[approved = "+false+"][typeof = '"+type+"'][creator = '"+commenter+"']");
      unapprovedThreadComments = $("#text").find(".commented-selection.threadNotApproved" + "[approved = "+true+"][typeof = '"+type+"'][creator = '"+commenter+"']");
    }
  }
  for(var i = 0; i < unapprovedComments.length; i++){
    let id = unapprovedComments[i]["attributes"]["id"]["value"];
    unapprovedCommentsId.push(id);
  }
  unapprovedCommentsId.forEach((element)=>{
    $("#"+element).addClass("unapprovedComments");
  });
  for(var i = 0; i < unapprovedThreadComments.length; i++){
   let id = unapprovedThreadComments[i]["attributes"]["id"]["value"];
   unapprovedThreadCommentsId.push(id);
  }
  // unapprovedThreadCommentsId.forEach((element)=>{
  //   $("#"+element).css({"color" : "darkOrange"});
  // });
}


// function checkOverLapSpans(commentData){
//   let overLapHash =[];
//   var indexArray = [];
//   for(var i = 0 ; i < commentData.length; i++){
//     let index = {
//       start: commentData[i].startIndex,
//       end: commentData[i].endIndex,
//       hash : commentData[i].hash
//     }
//     if(indexArray.length !=0){
//       for(let j = 0; j< indexArray.length ; j++){
//         let index1 = {
//           start: indexArray[j].start,
//           end: indexArray[j].end,
//           hash: indexArray[j].hash
//         }
//         //--==-
//         if((index.start < index1.start && index.end > index1.end) || (index.start > index1.start && index.end < index1.end)){
//           overLapHash.push(overLapCommentHelper(index,index1));
//         }
//         //==--
//         else if ((index.start == index1.start && index.end < index1.end) || (index.start == index1.start && index.end > index1.end)){
//           overLapHash.push(overLapCommentHelper(index,index1));
//         }
//         //--==
//         else if ((index.start < index1.start && index.end == index1.end) || (index.start > index1.start && index.end == index1.end)){
//           overLapHash.push(overLapCommentHelper(index,index1));
//         }
//       }
//     }
//     indexArray.push(index);
//   }
//   var hash = [];
//   for (var i = 0 ; i < overLapHash.length; i++){
//     if(hash.length ==0){
//       hash.push(overLapHash[i]);
//     }
//     else{
//       let hashExist = false;
//       for(var j = 0 ; j<hash.length; j++){
//         if(hash[j] == overLapHash[i]){
//           hashExist == true;
//           break;
//         }
//       }
//       if(!hashExist){
//         hash.push(overLapHash[i]);
//       }
//     }
//   }
//   console.log(hash);
//   return hash;
// }
//this helper function returns the shorter comment
// return the first comment if the length is the same
overLapCommentHelper = (comment1,comment2) =>{
  let length1 = comment1.end - comment1.start;
  let length2 = comment2.end - comment2.start;
  if(length1 > length2){
    return comment2.hash;
  }
  else if(length1 < length2){
    return comment1.hash;
  }
  else{
    return comment1.hash;
  }
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

// highlightOverLapText = ({startIndex, endIndex, commentType, eppn, hash , approved} = {}) => {
//     let range = rangy.createRange();
//     range.selectCharacters(document.getElementById(TEXTSPACE), startIndex, endIndex);
//     let area = rangy.createClassApplier("overLapComments", {
//         useExistingElements: false,
//         elementAttributes: {
//             "id": hash,
//             "creator": eppn,
//             "typeof": commentType,
//             "approved": approved
//         }
//     });
//     area.applyToRange(range);
//     //$("#"+hash).addClass("commented-selection");
// }

// this function only check if the selected_eppn is same as the current user or not
function isCurrentUserSelectedUser(selected_eppn,needNotification){
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
      // if(mode == "setting"){
      //   $("#setting").addClass("noPermission");
      // }
      if(mode == "approvedComments"){
        $("#replies").attr("isCurrentUserAdmin",false);
      }
    }
    else{
      // if(mode == "setting"){
      //   $("#setting").removeClass("noPermission");
      // }
      if(mode == "approvedComments"){
        $("#replies").attr("isCurrentUserAdmin",true);
      }
    }
  });
}

function launchToastNotifcation(data){
  // $("#toast-notification").addClass("show");
  // $("#notification-data").html(data);
  // setTimeout(function(){
  //   $("#toast-notification").removeClass("show");
  //   $("#notification-data").empty();
  // }, 3000);
  var message = {message: data}
  console.log(data)
  var snackbarContainer = document.querySelector('.mdl-js-snackbar');
  snackbarContainer.MaterialSnackbar.showSnackbar(message);
}

//Make sure the dialog don't exceed the window
function adjustDialogPosition(evt,width,height,marginX,marginY){
  let newLeft = (evt.pageX - marginX) + "px";
  let newTop = (evt.pageY + marginY) + "px";
  if (evt.clientY + (marginY + height) > $(window).height()) {
    newTop = (evt.pageY - (marginY + height)) + "px";
  }
  if (evt.pageX + width > $(window).width()){
    newLeft = $(window).width() - (width + marginX) + "px";
  }
  return {newTop,newLeft}
}

//fucntions that were made by ppl before
//------------------------------------------------------------------------------

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
  $("[aria-describedby='replies']").hide();
  $("[aria-describedby='commentBox']").hide();
}
