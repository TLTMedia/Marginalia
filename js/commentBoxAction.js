function makeDraggableCommentBox(workCreator,work) {
  if ($("#commentBox").length) {
    if ($(".commentTypeDropdown").length < 1) {
      $("#commentBox").append(dropdown);
    }
    //TODO not sure is it correct to put remSpan here, remSpan = "hl_eppn@.stonybrook.edu"
    //remSpan = null;
    $("#commentBox").dialog({
      dialogClass: "no-close",
      modal: true,
      width: 500,
      use: 'comments',
      buttons: [{
          text: "Save",
          id: "commentSave",
          click: function(){
            saveButtonOnClick(workCreator,work);
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

    //close button
    var closeCommentBox =  $("<button/>",{
      text:"X",
      class:"closeCommentBox",
      click:function(){
          exitButtonOnClick();
          $("#replies").parent().css("z-index","1");
          $("#commentBox").parent().css("z-index","0");
      }
    });
    // TODO find a better way to add it
    $("#commentBox").parent().find("#ui-id-1").prepend(closeCommentBox);
    $(".closeCommentBox").parent().css({position: 'relative'});
    $(".closeCommentBox").css({top: 0, left: 0, position:'absolute'});
  }
}

function saveButtonOnClick(workCreator,work) {
  var commentText = CKEDITOR.instances.textForm.getData();
  var isTextAreaEmpty = commentText.replace(/<p>(.*)<\/p>/g,`$1`).replace(/\s/g,"").replace(/&nbsp;/g,"").length;
  if (!isTextAreaEmpty) {
    launchToastNotifcation("Please put in some comment before you save");
  }
  else {
    var literatureName = work;
    var creator = workCreator;
    var commentType = $(".commentTypeDropdown").val();
    var span = $("." + escapeSpecialChar(remSpan));
    var replyTo = $("#commentBox").attr("data-replytoeppn");
    var replyHash = $('#commentBox').attr("data-replytohash");
    var dataForSave = getDataForSave(creator,literatureName,commentText,commentType,span,replyTo,replyHash);
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
      var dataForEdit = getDataForEditOrDelete(creator,literatureName,editCommentID,commentCreatorEppn,commentType,commentText,true);
      //console.log(dataForEdit);
      editOrDelete(dataForEdit,true);
      $("#commentBox").attr('data-editCommentID','-1');
      $("#commentBox").parent().fadeOut();
    }
    //check if the replyToEppn is undefined to see if this is a reply or not
    else if ($("#commentBox").attr("data-replyToEppn")) {
      saveCommentOrReply(dataForSave,false);
      $("#commentBox").parent().fadeOut();
    }
    else{
      //addNewCommenterToDropDown(currentUser.eppn);
      console.log("Saved As Comment");
      saveCommentOrReply(dataForSave,true);
      $("#commentBox").parent().fadeOut();
    }
  }
}

function updateCommenterSelectors(){
  var newCommenters = [];
  var comments = $("#textSpace").find('span');
  for(var i = 0 ; i < comments.length ; i++){
    //check if this is the commentSpan or not (only commentSpan has a creator attribute)
    if(comments[i]['attributes']['creator']){
      var commenter = comments[i]['attributes']['creator']['value'];
      var isCommenterExist = false;
      for(var j = 0 ; j < newCommenters.length ; j++){
        if(commenter == newCommenters[j]){
          isCommenterExist = true;
        }
      }
      if(!isCommenterExist){
        newCommenters.push(commenter);
      }
    }
  }
  makeCommentersSelector(newCommenters);
}

//return a dictionary with the data we need to save
function getDataForSave(creator,literatureName,commentText,commentType,span,replyTo,replyHash){
  var dataForSave = {
    author: creator,
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
      callback: null
  }).then((data) => {
    launchToastNotifcation(data['message']);
    if(!isComment){
      var firstCommentId = $("#replies").attr("data-firstCommentId");
      refreshReplyBox(dataForSave["author"],dataForSave["work"],$("#"+firstCommentId).attr("creator"),firstCommentId);
    }
    else{
      let approved;
      $('.'+escapeSpecialChar(remSpan)).removeAttr('startindex endIndex');
      if(data["additonal"] == true){
        approved = true;
      }
      else{
        approved = false;
      }
      $('.'+escapeSpecialChar(remSpan)).attr({
        'id':data['commentHash'],
        'creator':currentUser.eppn,
        'typeof':dataForSave['commentType'],
        'approved':approved
      });
      $('.'+escapeSpecialChar(remSpan)).removeClass(remSpan);
      updateTypeSelector(dataForSave["replyHash"],dataForSave["commentType"]);
      updateCommenterSelectors();

      //update the click event on this new added comment
      $("#"+data['commentHash']).off().on("click", function(evt) {
        var commentSpanId = $(this).attr('id');
        console.log(evt);
        clickOnComment(commentSpanId,dataForSave["work"],dataForSave["author"],evt);
      });
      markUnapprovedComments();
    }
  });
}

function getDataForEditOrDelete(creator,literatureName,hash,commentCreatorEppn,commentType,commentText){
  var common = {
    creator: creator,
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
  var sendData;
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
  sendData = JSON.stringify(commonData);
  //console.log(sendData);
  API.request({
    endpoint:endPoint,
    method: "POST",
    data: sendData,
    callback: null
  }).then((data)=>{
    launchToastNotifcation(data);
    var firstCommentId = $("#replies").attr("data-firstCommentId");
    refreshReplyBox(dataForEditOrDelete["creator"],dataForEditOrDelete["work"],$("#"+firstCommentId).attr("creator"),firstCommentId);
    if(isEdit){
      if(dataForEditOrDelete["type"]){
        updateTypeSelector(dataForEditOrDelete["hash"],dataForEditOrDelete["type"]);
      }
    }
    //unhighlight the deleted comment
    //update the commenterSelector and the typeSelector
    if(firstCommentId == $("#replies").attr("deletedid")){
      console.log("should unwrap");
      removeDeletedSpan(firstCommentId);
      updateCommenterSelectors(firstCommentId);
      updateTypeSelector(undefined,"All");
      $("#replies").parent().hide();
    }
    $("#replies").removeAttr("deletedid");
  });
}

function removeDeletedSpan(id){
  $("#"+id).contents().unwrap();
}

function exitButtonOnClick(){
  CKEDITOR.instances.textForm.setData("");
  $("#commentExit").text("Exit");
  unhighlight();
  $("#commentBox").parent().fadeOut();
}

function displayCommentBox(evt,id) {
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
  $("#replies").attr("data-firstCommentId",id);
  $("#commentBox").attr("data-editcommentid","-1");
  $("#commentBox").parent().find("#ui-id-1").contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith("Annotation by: " + currentUser['firstname'] + " " + currentUser['lastname']);
  $("#commentBox").parent().fadeIn();
}

function hideCommentBox(){
  $("#commentBox").parent().hide();
}
