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
    let closeCommentBox = createCloseCommentBoxButton();
    // TODO find a better way to add it
    $("#commentBox").parent().find(".ui-dialog-titlebar").prepend(closeCommentBox);
    $(".closeCommentBox").parent().css({position: 'relative'});
    $(".closeCommentBox").css({top: 0, left: 0, position:'absolute'});
  }
}

function createCloseCommentBoxButton(){
  var closeCommentBoxDiv = $("<div>",{
    class: "closeCommentBoxDiv"
  });
  //close button
  var closeCommentBox =  $("<button/>",{
    class:"closeCommentBox",
    click:function(){
        exitButtonOnClick();
        // $("#replies").parent().css("z-index","1");
        // $("#commentBox").parent().css("z-index","0");
    }
  });
  var closeCommentBoxIcon = $("<i/>",{
    class: "material-icons closeCommentBoxIcon",
    text: "highlight_off"
  });
  closeCommentBox.append(closeCommentBoxIcon);
  closeCommentBoxDiv.append(closeCommentBox);
  return closeCommentBoxDiv;
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
    //if editCommentId is not -1 it is an edit action
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
      console.log("Saved As Comment");
      saveCommentOrReply(dataForSave,true);
      $("#commentBox").parent().fadeOut();
    }
  }
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

// isComment is true then this is the first comment
// isComment is false mean this is a reply to some other people's comment
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
    let firstCommentData,type;
    //reply to other user's comment
    if(!isComment){
      var firstCommentId = $("#replies").attr("data-firstCommentId");
      refreshReplyBox(dataForSave["author"],dataForSave["work"],$("#"+firstCommentId).attr("creator"),firstCommentId);
      firstCommentData = {
        creator: dataForSave["author"],
        work: dataForSave["work"],
        commenter:$("#"+firstCommentId).attr("creator"),
        hash: firstCommentId
      };
      type = undefined;
    }
    // the first comment
    else{
      let approved;
      $('.'+escapeSpecialChar(remSpan)).removeAttr('startindex endIndex');
      console.log(data);
      if(data["approval"] == true){
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
      firstCommentData = {
        creator: dataForSave["author"],
        work: dataForSave["work"],
        commenter: currentUser.eppn,
        hash: dataForSave["replyHash"]
      };
      type = dataForSave['commentType'];
    }
    console.log(dataForSave['commentType']);
    // this function takes the first comment data
    checkThreadUnapprovedComments(firstCommentData,type,"AllCommenters",markUnapprovedComments);
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
        $("#"+dataForEditOrDelete["hash"]).attr("typeof",dataForEditOrDelete["type"]);
        updateTypeSelector(dataForEditOrDelete["hash"],dataForEditOrDelete["type"]);
      }
      autoApprove(dataForEditOrDelete["hash"],dataForEditOrDelete["commenter"],dataForEditOrDelete["work"],dataForEditOrDelete["creator"]);
    }
    else{
      //unhighlight the deleted comment
      //update the commenterSelector and the typeSelector
      if(firstCommentId == $("#replies").attr("deletedid")){
        console.log("should unwrap");
        removeDeletedSpan(firstCommentId);
        updateCommenterSelectors(firstCommentId);
        updateTypeSelector(undefined,"All");
        $("#replies").parent().hide();
      }
      else{
        // if the first comment is deleted, no checking required
        // update and mark the unapproved comments
        let firstCommentData = {
          creator: dataForEditOrDelete["creator"],
          work: dataForEditOrDelete["work"],
          commenter: $("#"+firstCommentId).attr("creator"),
          hash: firstCommentId
        }
        checkThreadUnapprovedComments(firstCommentData,undefined,undefined,markUnapprovedComments);
      }
      $("#replies").removeAttr("deletedid");
    }

  });
}

//ADDED SEP 4 Can remove if backend is fixed
function autoApprove(hash,commenterEppn,work,workCreator){
  API.request({
    endpoint: "comments_need_approval/"+workCreator+"/"+work,
    method: "GET"
  }).then((data)=>{
    console.log("autoApprove ",data)
    if(data == "false"){
      commentApprovedButtonOnClick(hash,commenterEppn,work,workCreator);
    }
  });
}

//TODO the id should chan
function removeDeletedSpan(id){
  $("#"+id).contents().unwrap();
}

function exitButtonOnClick(){
  CKEDITOR.instances.textForm.setData("");
  $("#commentExit").text("Exit");
  unhighlight();
  $("#commentBox").parent().fadeOut();
}


//commentBox width: 500 px ,height: 331px , marginX : 10, marginY : 50
function displayCommentBox(evt) {
  var marginX = 10;
  var marginY = 50;
  var newPosition = adjustDialogPosition(evt,500,331,10,50);
  $("#commentBox").parent().css({
    'top': newPosition["newTop"],
    'left': newPosition["newLeft"]
  })
  $("#commentBox").parent().find("#ui-id-1").contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith("Annotation by: " + currentUser['firstname'] + " " + currentUser['lastname']);
  $("#commentBox").parent().fadeIn();
}

function hideCommentBox(){
  $("#commentBox").parent().hide();
}
