// This is the box that will house the various replies a comment thread may hold
function makeDraggableReplyBox() {
  if ($("#replies").length){
    $("#replies").dialog({
      dialogClass: "no-close",
      use: 'reply',
      modal: true,
      width: 500,
      title: "Comments"
    });
    var closeReplyBox =  $("<button/>",{
      text:"X",
      class:"closeReplyBox",
      click:function(){
          $("#replies").parent().fadeOut();
          // $("#replies").parent().css("z-index","0");
          // $("#commentBox").parent().css("z-index","1");
      }
    });
    // TODO find a better way to add it
    $("#replies").parent().find("#ui-id-2").prepend(closeReplyBox);
    $(".closeReplyBox").parent().css({position: 'relative'});
    $(".closeReplyBox").css({top: 0, left: 0, position:'absolute'});
  }
}

function escapeHTMLPtag(text){
  return text.replace(/<p>(.*)<\/p>/,` $1\n`);
}

/*
* eppn : commenterEppn
* approved : if the comment is approved or not
*/
function createReplies(dataForReplies) {
  let eppn = dataForReplies["eppn"];
  let firstName = dataForReplies["firstName"];
  let lastName = dataForReplies["lastName"];
  let public = dataForReplies["public"];
  let type = dataForReplies["type"];
  let commentText = dataForReplies["commentText"];
  let hash = dataForReplies["hash"];
  let approved = dataForReplies["approved"];
  let parentHash = dataForReplies["parentId"];
  let work = dataForReplies["work"];
  let workCreator = dataForReplies["workCreator"];
  var userName = firstName + " " + lastName;
  var hashForReply = 'r'+hash;
  var inText = atob(commentText);
  inText = escapeHTMLPtag(inText);
  var repliesClass;
  var repliesSpan;
  //check if this relpy is deleted
  if(firstName == 'deleted' && lastName == 'deleted'){
    repliesSpan = "<span class = 'replyText' id = '"+hashForReply+"'>"+inText+"</span>";
    repliesClass = "replies";
  }
  else{
    if(!approved){
      repliesSpan = "<span class = 'replyText' id = '"+hashForReply+"'>"+userName + ": " +inText+"<i>(comment needs approvement)</i></span>";
      repliesClass = "replies unapproved";
    }
    else{
      if(!public){
        repliesSpan = "<span class = 'replyText' id = '"+hashForReply+"'>"+userName + ": " +inText+"<i>(private comment)</i></span>";
        repliesClass = "replies private";
      }
      else{
        repliesSpan = "<span class = 'replyText' id = '"+hashForReply+"'>"+userName + ": " +inText+"</span>";
        repliesClass = "replies";
      }
    }
  }
  var replyBox = $('<div/>', {
    class: repliesClass,
    commentid: hash,
    name: eppn,
    haschild:0,
    flname:firstName+lastName,
    type:type
  });

  replyBox.html(repliesSpan);

  // this reply has a parent
  if (parentHash != null) {
    $(".replies"+"[commentid = '"+parentHash+"']").append(replyBox);
    $(".replies"+"[commentid = '"+parentHash+"']").attr("haschild","1");
    //if this is a deleted comment
    // hide the dev if the current comment is a deleted comment
    if(firstName == 'deleted' && lastName == 'deleted'){
      $(".replies"+"[commentid = '"+hash+"']").hide();
    }
    //shows the deleted reply if it has a child
    if($(".replies"+"[commentid = '"+parentHash+"']").attr("haschild") == 1){
      $(".replies"+"[commentid = '"+parentHash+"']").show();
    }
  }
  // this reply doesn't have a parent (first Comment)
  else {
    $("#replies").append(replyBox);
    $("#r"+hash).addClass("firstComment");
  }
  createMenuForComment(inText,hash,eppn,hashForReply,approved,public,work,workCreator)
}


//TODO this function can be shorter
function createMenuForComment(inText,hash,eppn,hashForReply,approved,public,work,workCreator){
  var commentMenuButton = $("<button/>",{
    class: "commentMenuButton mdl-button mdl-js-button mdl-button--icon",
    id:"m"+hash,
    click: ()=>{
      commentMenuOnClick(hash);
    }
  });
  var icon = $("<i/>",{
    class: "material_icons",
    text: "..."
  });
  //create Buttons
  var menu = $("<ul/>",{
    class: "commentMenu mdl-menu--bottom-right mdl-menu mdl-js-menu",
    for: "m"+hash,
    commentid: hash
  });
  var menuReply = $("<li/>",{
    class: "replyToComments mdl-menu__item",
    text: "Reply",
    commentid: hash,
    click: ()=>{
      replyButtonOnClick();
    }
  });
  var menuEdit = $("<li/>",{
    class: "editComments mdl-menu__item",
    text: "Edit",
    commentid:hash,
    click: ()=>{
      editButtonOnClick(inText,hash);
    }
  });
  var menuDelete = $("<li/>",{
    class: "deleteComments mdl-menu__item",
    text: "Delete",
    commentid:hash,
    click: ()=>{
      deleteButtonOnClick(hash,eppn,hashForReply,work,workCreator);
    }
  });
  var menuSetPrivate = $("<li/>",{
    class: "setCommentsPrivate mdl-menu__item",
    text: "Set Private",
    commentid: hash,
    click : (evt)=>{
      commentPrivateButtonOnClick(evt,work,workCreator,false);
    }
  });
  var menuSetPublic = $("<li/>",{
    class: "setCommentsPublic mdl-menu__item",
    text: "Set Public",
    commentid: hash,
    click : (evt)=>{
      commentPrivateButtonOnClick(evt,work,workCreator,true);
    }
  });
  var menuApprove = $("<li/>",{
    class: "approveComments mdl-menu__item",
    text: "Approve",
    commentid: hash,
    click: (evt)=>{
      var commenterEppn = eppn;
      commentApprovedButtonOnClick(hash,commenterEppn,work,workCreator);
    }
  });
  $(commentMenuButton).append(icon);
  //comment is approved and currentUser is the comment creator
  if(approved && isCurrentUserSelectedUser(eppn,false)){
    $(menu).append(menuReply,menuEdit,menuDelete);
    if(public){
      $(menu).append(menuSetPrivate);
    }
    else{
      $(menu).append(menuSetPublic);
    }
  }
  //comment is approved and currentUser is not the comment creator
  else if(approved && !isCurrentUserSelectedUser(eppn,false)){
    $(menu).append(menuReply);
  }
  // comment is unapproved and currentUser is the comment creator
  else if(!approved){
    if(isCurrentUserSelectedUser(eppn,false)){
      $(menu).append(menuEdit);
    }
    //TODO not sure why it only works when set it to string
    //Assuming that no boolean can be stored on DOM element attr
    if($("#replies").attr("isCurrentUserAdmin") == "true"){
      $(menu).append(menuApprove,menuDelete);
    }
    else{
      $(menu).append(menuDelete);
    }

  }
  var span = $("#r"+hash);
  if(span.text() != 'deleted'){
    span.append(commentMenuButton,menu);
  }
  componentHandler.upgradeAllRegistered();
}

function commentMenuOnClick(rid){
  $(".commentMenu").hide();
  $(".commentMenu" + "[commentid = '"+rid+"']").show();
  console.log("commentMenuOnClick");
  var replyToEppn = $(".replies" + "[commentid = '"+rid+"']").attr('name');
  $("#commentBox").attr("data-replyToEppn", replyToEppn);
  $("#commentBox").attr("data-replyToHash", rid);
  $("#commentSave").show();
  $("#commentExit").text("Exit");
  $(".commentMenu").children("li").hide();
  $(".commentMenu").children("li"+"[commentid = '"+rid+"']").show();
  CKEDITOR.instances.textForm.setReadOnly(false);
}

function replyButtonOnClick(){
  CKEDITOR.instances.textForm.setData("");
  $('.commentTypeDropdown').attr('disabled',true);
  var firstCommentId = $('#replies').attr('data-firstCommentId');
  $('.commentTypeDropdown').val($("#"+firstCommentId).attr("typeof"));
  $("#commentBox").attr("data-editCommentID", "-1");
  $("#commentBox").parent().fadeIn();
}

function editButtonOnClick(inText,hash){
  $("#commentBox").attr("data-editCommentID",hash);
  $("#commentBox").parent().fadeIn();
  CKEDITOR.instances.textForm.setData(inText);
  $('.commentTypeDropdown').attr('disabled',true);
  if($(".replies"+"[commentid = '"+hash+"']").attr('type')!= undefined){
    $('.commentTypeDropdown').removeAttr('disabled');
  }
  var firstCommentId = $('#replies').attr('data-firstCommentId');
  $('.commentTypeDropdown').val($("#"+firstCommentId).attr("typeof"));
}

function deleteButtonOnClick(hash,eppn,hashForReply,work,workCreator){
  var deletedId = hash;
  $("#replies").attr("deletedId",deletedId);
  var data = getDataForEditOrDelete(workCreator,work,hash,eppn,null,null);
  editOrDelete(data,false);
}

function commentPrivateButtonOnClick(evt,work,workCreator,setPublic){
  var commentId = evt["currentTarget"]["attributes"]["commentid"]["value"];
  console.log(commentId);
  var data = JSON.stringify({
    creator: workCreator,
    work: work,
    comment_hash: commentId,
    public: setPublic ? true: false
  });
  API.request({
    endpoint: "set_comment_public",
    method: "POST",
    data: data
  }).then((data)=>{
    if(setPublic){
      launchToastNotifcation("successfully set comment to public");
    }
    else{
      launchToastNotifcation("successfully set comment to private");
    }
    let firstCommentId = $("#replies").attr("data-firstCommentId");
    let firstCommentCommenter = $("#"+firstCommentId).attr("creator");
    refreshReplyBox(workCreator,work,firstCommentCommenter,firstCommentId);
  });
}

function commentApprovedButtonOnClick(hash,commenterEppn,work,workCreator){
  var data = JSON.stringify({
    creator: workCreator,
    work: work,
    commenterEppn: commenterEppn,
    comment_hash: hash,
    approved: true
  });
  API.request({
    endpoint: "approve_comment",
    method:"POST",
    data: data
  }).then((data)=>{
    launchToastNotifcation(data);
    $("#"+hash).attr("approved",true);
    let currentSelectedType = $(".typeSelector").attr("currentTarget");
    let currentSelectedCommenter = $(".commenterSelector").attr("currentTarget");
    console.log(currentSelectedType,currentSelectedCommenter);
    let firstCommentHash = $("#replies").attr("data-firstCommentId");
    let  firstCommenter = $(".replies" + "[commentId = '"+firstCommentHash+"']").attr("name");
    let firstCommentData = {
      creator:workCreator,
      work:work,
      commenter: firstCommenter,
      hash: firstCommentHash
    }
    checkThreadUnapprovedComments(firstCommentData,currentSelectedType,currentSelectedCommenter,markUnapprovedComments);
    refreshReplyBox(workCreator,work,firstCommenter,firstCommentHash);
  });
}
// This displays the replies for the current comment box
function displayReplyBox(evt) {
  var newTop = evt.pageY + "px";
  var newLeft = width * .55 + "px";

  $("#replies").parent().css({
    'top': newTop,
    'left': newLeft
  })
  $("#replies").parent().fadeIn();
}

function hideReplyBox(){
  $("#replies").parent().hide();
}

//commenter : the first commenter
//hash : the first comment hash
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
