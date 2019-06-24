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
          $("#replies").parent().css("z-index","0");
          $("#commentBox").parent().css("z-index","1");
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

function createReplies(eppn, firstName, lastName, startDex, endDex, isVisible, type, commentText, threads, hash, parentHash = null) {
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
  // this reply has a parent
  if (parentHash != null) {
    //if this is a deleted comment
    $(".replies"+"[commentid = '"+parentHash+"']").append(replyBox);
    $(".replies"+"[commentid = '"+parentHash+"']").attr("haschild","1");
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
  createMenuForComment(inText,hash,eppn,hashForReply);
}

function createMenuForComment(inText,hash,eppn,hashForReply){
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
    class: "commentMenu mdl-menu mdl-js-menu",
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
      deleteButtonOnClick(hash,eppn,hashForReply);
    }
  });
  var menuSetPrivate = $("<li/>",{
    class: "setCommentsPrivate mdl-menu__item",
    text: "Set Private",
    commentid: hash,
    click : (evt)=>{
      commentPrivateButtonOnClick(evt,false);
    }
  });
  var menuSetPublic = $("<li/>",{
    class: "setCommentsPublic mdl-menu__item",
    text: "Set Public",
    commentid: hash,
    click : (evt)=>{
      commentPrivateButtonOnClick(evt,true);
    }
  });
  $(commentMenuButton).append(icon);
  $(menu).append(menuReply,menuEdit,menuDelete,menuSetPrivate,menuSetPublic);
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
  if (currentUser.eppn == replyToEppn) {
    $(".commentMenu").children("li"+"[commentid = '" + rid + "']").show();
    // $(".editComments" + "[commentid = '" + rid + "']").show();
    // $(".deleteComments" + "[commentid = '" + rid + "']").show();
    // $(".setCommentsPrivate" +"[commentid = '" + rid + "']").show();
    // $(".setCommentsPublic" +"[commentid = '" + rid + "']").show();
  }
  else {
      $(".replyToComments" + "[commentid = '" + rid + "']").show();
  }
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

function deleteButtonOnClick(hash,eppn,hashForReply){
  var deletedId = hash;
  $("#replies").attr("deletedId",deletedId);
  var literatureName = $(".chosenFile").text();;
  var data = getDataForEditOrDelete(literatureName,hash,eppn,null,null);
  editOrDelete(data,false);
}

function commentPrivateButtonOnClick(evt,setPrivate){
  var commentId = evt["currentTarget"]["attributes"]["commentid"]["value"];
  console.log(commentId);
  var data = JSON.stringify({
    creator: $(".chosenUser").text().split(":")[0],
    work: $(".chosenFile").text(),
    comment_hash: commentId,
    public: setPrivate ? true: false
  });
  API.request({
    endpoint: "set_comment_public",
    method: "POST",
    data: data
  }).then((data)=>{
    console.log(data);
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
