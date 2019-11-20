// This is the box that will house the various replies a comment thread may hold
function makeDraggableReplyBox() {
    if ($("#replies").length) {
        $("#replies").dialog({
            dialogClass: "no-close",
            use: 'reply',
            modal: true,
            width: 500,
            title: "Comments"
        });
        let closeReplyBox = createCloseReplyBoxButton();
        let replyTips = createReplyBoxTips();
        $("#replies").parent().find(".ui-dialog-titlebar").prepend(closeReplyBox);
        $("#replies").parent().find(".ui-dialog-titlebar").append(replyTips);
        $(".closeReplyBox").parent().css({ position: 'relative' });
        $(".closeReplyBox").css({ top: 0, left: 0, position: 'absolute' });
    }
}

function createCloseReplyBoxButton() {
    var closeReplyBoxDiv = $("<div>", {
        class: "closeReplyBoxDiv"
    })
    var closeReplyBox = $("<button/>", {
        // text:"X",
        class: "closeReplyBox",
        click: function () {
            $("#replies").parent().fadeOut();
        }
    });
    var closeReplyBoxIcon = $("<i>", {
        class: "material-icons closeReplyBoxIcon",
        text: "highlight_off"
    });
    closeReplyBox.append(closeReplyBoxIcon);
    closeReplyBoxDiv.append(closeReplyBox);
    return closeReplyBoxDiv;
}

function createReplyBoxTips() {
    var replyTips = $("<div>", {
        class: "replyBoxTips"
    });
    var replyTipsIcon = $("<i/>", {
        class: "material-icons replyBoxTipsIcon",
        text: "help"
    });

    var replyTipsText = $("<span>", {
        class: "replyBoxTipsText"
    });
    replyTipsText.html("The <span style = 'color: blue'>Blue</span> comments with<i class = 'material-icons lock'>lock</i>icon are private comments.\n The <span style = 'color : grey'>Grey</span> comments with <i class = 'material-icons unapproved'>hourglass_full</i> icon are unapproved commments");
    replyTips.append(replyTipsIcon, replyTipsText);
    return replyTips;
}

function escapeHTMLPtag(text) {
    return text.replace(/<p>(.*)<\/p>/, ` $1\n`);
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
    var hashForReply = 'r' + hash;
    var inText = atob(commentText);
    inText = escapeHTMLPtag(inText);
    var repliesClass;
    var repliesSpan;
    //check if this relpy is deleted
    if (firstName == 'deleted' && lastName == 'deleted') {
        repliesSpan = "<span class = 'replyText' id = '" + hashForReply + "'>" + inText + "</span>";
        repliesClass = "replies";
    }
    else {
        if (!approved) {
            repliesSpan = "<span class = 'replyText' id = '" + hashForReply + "'>" + userName + ": " + inText + "<i class = 'material-icons unapproved'>hourglass_full</i></span>";
            repliesClass = "replies unapproved";
        }
        else {
            if (!public) {
                repliesSpan = "<span class = 'replyText' id = '" + hashForReply + "'>" + userName + ": " + inText + "<i class = 'material-icons lock'>lock</i></span>";
                repliesClass = "replies private";
            }
            else {
                repliesSpan = "<span class = 'replyText' id = '" + hashForReply + "'>" + userName + ": " + inText + "</span>";
                repliesClass = "replies";
            }
        }
    }
    var replyBox = $('<div/>', {
        class: repliesClass,
        commentid: hash,
        name: eppn,
        haschild: 0,
        type: type
    });
    replyBox.html(repliesSpan);

    // this reply has a parent
    if (parentHash != null) {
        $(".replies" + "[commentid = '" + parentHash + "']").append(replyBox);
        $(".replies" + "[commentid = '" + parentHash + "']").attr("haschild", "1");
        //shows the deleted reply if it has a child
        if ($(".replies" + "[commentid = '" + parentHash + "']").attr("haschild") == 1) {
            $(".replies" + "[commentid = '" + parentHash + "']").show();
        }
    }
    // this reply doesn't have a parent (first Comment)
    else {
        $("#replies").append(replyBox);
        $("#r" + hash).addClass("firstComment");
    }
    createToolBar(inText, hash, eppn, hashForReply, approved, public, work, workCreator);
}

function createToolBar(inText, hash, eppn, hashForReply, approved, public, work, workCreator) {
    let toolBar = $("<div/>", {
        class: "toolBar",
        commentId: hash
    });
    $(".replies" + "[commentid = '" + hash + "']").append(toolBar);
    let replyButton = $("<button/>", {
        class: "replyToComments mdl-button mdl-js-button",
        commentId: hash,
        click: (evt) => {
            $(".select2-save-comment-select").prop("disabled", false);
            $(".select2-selection").removeClass("disabled_dropDown");
            replyButtonOnClick(evt, hash);
        }
    });
    replyButton.html("<i class = 'material-icons'> reply </i> <label>Reply</label>");
    let editButton = $("<button/>", {
        class: "editComments mdl-button mdl-js-button",
        commentId: hash,
        click: (evt) => {
            editButtonOnClick(evt, inText, hash);
        }
    });
    editButton.html("<i class = 'material-icons'> edit </i> <label>Edit</label>");
    if (inText != "deleted") {
      if (approved && isCurrentUserSelectedUser(eppn, false)) {
          toolBar.append(replyButton, editButton);
      }
      else if (approved && !isCurrentUserSelectedUser(eppn, false)) {
          toolBar.append(replyButton);
      }
      else if (!approved && isCurrentUserSelectedUser(eppn, false)) {
          toolBar.append(editButton);
      }
    }
    createMenuForComment(inText, hash, eppn, hashForReply, approved, public, work, workCreator);
}


//TODO this function can be shorter
function createMenuForComment(inText, hash, eppn, hashForReply, approved, public, work, workCreator) {
    var commentMenuButton = $("<button/>", {
        class: "commentMenuButton mdl-button mdl-js-button mdl-button--icon",
        id: "m" + hash,
        click: () => {
            commentMenuOnClick(hash);
        }
    });
    var icon = $("<i/>", {
        class: "material-icons",
        text: "more_vert"
    });
    $(commentMenuButton).append(icon);
    //create Buttons
    var menu = $("<ul/>", {
        class: "commentMenu mdl-menu--bottom-right mdl-menu mdl-js-menu",
        for: "m" + hash,
        commentid: hash
    });
    var menuDelete = $("<li/>", {
        class: "deleteComments mdl-menu__item",
        text: "Delete",
        commentid: hash,
        click: () => {
            deleteButtonOnClick(hash, eppn, work, workCreator);
        }
    });
    var menuSetPrivate = $("<li/>", {
        class: "setCommentsPrivate mdl-menu__item",
        text: "Set Private",
        commentid: hash,
        click: (evt) => {
            commentPrivateButtonOnClick(evt, work, workCreator, false);
        }
    });
    var menuSetPublic = $("<li/>", {
        class: "setCommentsPublic mdl-menu__item",
        text: "Set Public",
        commentid: hash,
        click: (evt) => {
            commentPrivateButtonOnClick(evt, work, workCreator, true);
        }
    });
    var menuApproveOrUnapprove = $("<li/>", {
        class: "approveComments mdl-menu__item",
        text: !(approved) ? "Approve" : "Unapprove",
        commentid: hash,
        click: (evt) => {
            var commenterEppn = eppn;
            commentApprovedOrUnapprovedButtonOnClick(hash, commenterEppn, work, workCreator, approved);
        }
    });

    //comment is approved and currentUser is the comment creator
    if (approved && isCurrentUserSelectedUser(eppn, false)) {
        $(menu).append(menuDelete);
        if (isCurrentUserSelectedUser(workCreator, false)) {
            $(menu).append(menuApproveOrUnapprove);
        }
        if (public) {
            $(menu).append(menuSetPrivate);
        }
        else {
            $(menu).append(menuSetPublic);
        }
    }
    //comment is approved and currentUser is not the comment creator
    else if (approved && !isCurrentUserSelectedUser(eppn, false)) {
        // if the currentUser is the author of the work
        if (isCurrentUserSelectedUser(workCreator, false)) {
            $(menu).append(menuApproveOrUnapprove);
        }
    }
    // comment is unapproved and currentUser is the comment creator
    else if (!approved) {
        if ($("#replies").attr("isCurrentUserAdmin") == "true") {
            $(menu).append(menuApproveOrUnapprove, menuDelete);
        }
        else {
            $(menu).append(menuDelete);
        }
    }
    var functionPlane = $(".toolBar" + "[commentId = '" + hash + "']");
    var textSpan = $("#r" + hash);
    if (textSpan.text() != 'deleted' && $(menu).has("li").length != 0) {
        functionPlane.append(commentMenuButton, menu);
    }
    componentHandler.upgradeAllRegistered();
}

function commentMenuOnClick(rid) {
    $(".commentMenu").hide();
    $(".commentMenu" + "[commentid = '" + rid + "']").show();
    $("#commentSave").show();
    $("#commentExit").text("Exit");
    $(".commentMenu").children("li").hide();
    $(".commentMenu").children("li" + "[commentid = '" + rid + "']").show();
    // CKEDITOR.instances.textForm.setReadOnly(false);
    TMP_STATE.quill.enable();
}

function replyButtonOnClick(evt, hash) {
    var replyToEppn = $(".replies" + "[commentid = '" + hash + "']").attr('name');

    TMP_STATE.commentBox_data = {
        "eppn_to_reply_to": replyToEppn,
        "hash_to_reply_to": hash
    };
    delete TMP_STATE.commentBox_data.edit_comment_id;

    TMP_STATE.quill.setText("");
    var first_comment_id = TMP_STATE.replyBox_data.first_comment_id;
    displayCommentBox(evt,$(".commented-selection" + "[commentId = '"+first_comment_id+"']").attr("typeof"));
}

function editButtonOnClick(evt, inText, hash) {
    TMP_STATE.commentBox_data = {
        "edit_comment_id": hash
    };
    let first_comment_id = TMP_STATE.replyBox_data.first_comment_id;
    displayCommentBox(evt, $(".commented-selection" + "[commentId = '"+first_comment_id+"']").attr("typeof"));
    TMP_STATE.quill.setText(inText);
    if(hash != TMP_STATE.replyBox_data.first_comment_id){
        console.log("not editting the first comment");
        $(".select2-save-comment-select").prop("disabled", true);
        $(".select2-selection").addClass("disabled_dropDown");
    }
    else{
        $(".select2-save-comment-select").prop("disabled", false);
        $(".select2-selection").removeClass("disabled_dropDown");
    }
}

function getDataForEditOrDelete(creator, literatureName, hash, commentCreatorEppn, commentType, commentText) {
    var common = {
        creator: creator,
        work: literatureName,
        commenter: commentCreatorEppn,
        hash: hash
    }
    var editData = {
        creator: creator,
        work: literatureName,
        type: commentType,
        text: commentText,
        public: true
    }
    var dataForEditOrDelete = Object.assign({}, common, editData);
    return dataForEditOrDelete;
}

async function deleteButtonOnClick(hash, eppn, work, workCreator) {
    console.log(TMP_STATE);
    TMP_STATE.replyBox_data["delete_comment_id"] = hash;
    let first_comment_id = TMP_STATE.replyBox_data.first_comment_id;
    let first_comment_author = TMP_STATE.replyBox_data.first_comment_author;

    var delete_data = {
        creator: workCreator,
        work: work,
        commenter: eppn,
        hash: hash
    }
    await TMP_STATE.api_data.comments_data.delete_comment(delete_data);



    if (first_comment_id == TMP_STATE.replyBox_data.delete_comment_id) {
        checkSpansNeedRecover(first_comment_id, removeDeletedSpan);
        let work_comment_data = await TMP_STATE.api_data.comments_data.get_work_highlights();
        //TODO NEED TO ADD RESET FILTER HERE, BUT CAN't ACCESS UI SO WAIT UNTIL THIS IS MODULAIZED.
        colorNotUsedTypeSelector(work_comment_data);
        $("#replies").parent().fadeOut();
    }
    else {
        refreshReplyBox(workCreator, work, first_comment_author, first_comment_id);
    }
    allowClickOnComment(delete_data["work"], delete_data["creator"])
    getUnapprovedComments(delete_data["creator"], delete_data["work"]);
    delete TMP_STATE.replyBox_data.delete_comment_id;
    $("#replies").removeAttr("deletedid");
}

function commentPrivateButtonOnClick(evt, work, workCreator, setPublic) {
    var commentId = evt["currentTarget"]["attributes"]["commentid"]["value"];
    var commenterEppn = $(".replies" + "[commentId = '" + commentId + "']").attr("name");
    var data = {
        creator: workCreator,
        work: work,
        comment_hash: commentId,
        public: setPublic ? true : false
    };
    API.request({
        endpoint: "set_comment_public",
        method: "POST",
        data: data
    }).then((data) => {
        if (setPublic) {
            launchToastNotifcation("successfully set comment to public");
        }
        else {
            launchToastNotifcation("successfully set comment to private");
        }
        let firstCommentId = TMP_STATE.replyBox_data.first_comment_id;
        let firstCommentCommenter = TMP_STATE.replyBox_data.first_comment_author;
        refreshReplyBox(workCreator, work, firstCommentCommenter, firstCommentId);
    });
}

function commentApprovedOrUnapprovedButtonOnClick(hash, commenterEppn, work, workCreator, approved) {
    console.log(hash)
    var data = {
        creator: workCreator,
        work: work,
        commenterEppn: commenterEppn,
        comment_hash: hash
    };
    let endpoint;
    if (approved) {
        endpoint = "unapprove_comment"
    }
    else {
        endpoint = "approve_comment"
    }
    API.request({
        endpoint: endpoint,
        method: "POST",
        data: data
    }).then((data) => {
        launchToastNotifcation(data);
        let firstCommentHash = TMP_STATE.replyBox_data.first_comment_id;
        let firstCommenter = TMP_STATE.replyBox_data.first_comment_author;
        let firstCommentData = {
            creator: workCreator,
            work: work,
            commenter: firstCommenter,
            hash: firstCommentHash
        }
        getUnapprovedComments(workCreator, work);
        refreshReplyBox(workCreator, work, firstCommenter, firstCommentHash);
    });
}

  /** This displays the replies for the current comment box
   *  update replyBox_Data => first_comment_id and first_comment_author
   **/
function displayReplyBox(data) {
    console.log(data);
    var marginX = 10;
    var marginY = 50;
    var newPosition = adjustDialogPosition(data, 500, 177, marginX, marginY);
    var type = data["typeOf"];
    $("#replies").parent().css({
        'top': newPosition["newTop"],
        'left': newPosition["newLeft"]
    });
    // ui-id-2 is the id for the title of the reply box
    $("#ui-id-2").empty().html(data["commentType"]);
    TMP_STATE.replyBox_data = {
        "first_comment_id": data["commentId"],
        "first_comment_author": data["commentCreator"]
    };
    //$("#replies").attr("data-firstCommentId", data["commentId"]);
    console.log(TMP_STATE.replyBox_data);
    $("#replies").parent().show();
}

function hideReplyBox() {
    $("#replies").parent().hide();
}

//commenter : the first commenter
//hash : the first comment hash
function refreshReplyBox(creator, work, commenter, hash, type) {
    console.log(creator, work, commenter, hash, type);
    $("#replies").empty();
    if (type != undefined || type != null) {
        $("#ui-id-2").html(type);
    }
    let comment_data = {
        creator: creator,
        work: work,
        commenter: commenter,
        hash: hash
    };
    get_comment_chain_API_request(comment_data);
}
