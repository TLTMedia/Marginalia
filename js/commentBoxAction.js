function makeDraggableCommentBox(workCreator, work) {
    $("#comment-box").dialog({
        dialogClass: "no-close",
        modal: true,
        width: 500,
        use: 'comments',
        buttons: [
            {
                text: "Save",
                id: "commentSave",
                click: function () {
                    saveButtonOnClick(workCreator, work);
                }
            },
            {
                text: "Exit",
                id: "commentExit",
                click: function () {
                    exitButtonOnClick();
                }
            },
        ],
        title: "Annotation by: "
    });
    // Making the actual commentForm system
    // var comForm = $('<form/>');
    // var textForm = $('<textarea/>', {
    //     id: "textForm",
    //     rows: "10",
    //     cols: "80"
    // });
    // $(comForm).append(textForm);
    // $('#comment-box').append(comForm);
    // CKEDITOR.replace('textForm');
    let closeCommentBox = createCloseCommentBoxButton();
    // TODO find a better way to add it
    $("#comment-box").parent().find(".ui-dialog-titlebar").prepend(closeCommentBox);
    $(".closeCommentBox").parent().css({ position: 'relative' });
    $(".closeCommentBox").css({ top: 0, left: 0, position: 'absolute' });

}

function createCloseCommentBoxButton() {
    var closeCommentBoxDiv = $("<div>", {
        class: "closeCommentBoxDiv"
    });
    //close button
    var closeCommentBox = $("<button/>", {
        class: "closeCommentBox",
        click: function () {
            exitButtonOnClick();
            // $("#replies").parent().css("z-index","1");
            // $("#comment-box").parent().css("z-index","0");
        }
    });
    var closeCommentBoxIcon = $("<i/>", {
        class: "material-icons closeCommentBoxIcon",
        text: "highlight_off"
    });
    closeCommentBox.append(closeCommentBoxIcon);
    closeCommentBoxDiv.append(closeCommentBox);
    return closeCommentBoxDiv;
}

function saveButtonOnClick(workCreator, work) {
    var commentText = TMP_STATE.quill.getHTML();
    // var commentText = CKEDITOR.instances.textForm.getData();
    var isTextAreaEmpty = commentText.replace(/<p>(.*)<\/p>/g, `$1`).replace(/\s/g, "").replace(/&nbsp;/g, "").length;
    if (!isTextAreaEmpty) {
        launchToastNotifcation("Please put in some comment before you save");
    }
    else {
        var literatureName = work;
        var creator = workCreator;
        var commentType = $(".commentTypeDropdown").val();
        var span = $("." + escapeSpecialChar(remSpan));
        var replyTo = $("#comment-box").attr("data-replytoeppn");
        var replyHash = $('#comment-box').attr("data-replytohash");
        var dataForSave = getDataForSave(creator, literatureName, commentText, commentType, span, replyTo, replyHash);
        //console.log(dataForSave);
        var editCommentID = $("#comment-box").attr("data-editCommentID");
        //if editCommentId is not -1 it is an edit action
        if (editCommentID != "-1") {
            var commentCreatorEppn = $(".replies" + "[commentid = '" + editCommentID + "']").attr('name');
            var commentType;
            //check if this is a coment or reply (reply will not have a type)
            if ($(".replies" + "[commentid = '" + editCommentID + "']").attr('type')) {
                commentType = $('.commentTypeDropdown').children("option:selected").val();
            }
            else {
                commentType = null;
            }
            var dataForEdit = getDataForEditOrDelete(creator, literatureName, editCommentID, commentCreatorEppn, commentType, commentText, true);
            //console.log(dataForEdit);
            editOrDelete(dataForEdit, true);
            $("#comment-box").attr('data-editCommentID', '-1');
            $("#comment-box").parent().fadeOut();
        }
        //check if the replyToEppn is undefined to see if this is a reply or not
        else if ($("#comment-box").attr("data-replyToEppn")) {
            saveCommentOrReply(dataForSave, false);
            $("#comment-box").parent().fadeOut();
        }
        else {
            console.log("Saved As Comment");
            saveCommentOrReply(dataForSave, true);
            $("#comment-box").parent().fadeOut();
        }
    }
}

//return a dictionary with the data we need to save
function getDataForSave(creator, literatureName, commentText, commentType, span, replyTo, replyHash) {
    var dataForSave = {
        author: creator,
        work: literatureName,
        commentText: commentText,
        commentType: commentType,
        startIndex: (span.attr("startIndex") ? span.attr("startIndex") : null),
        endIndex: (span.attr("endIndex") ? span.attr("endIndex") : null),
        replyTo: (replyTo ? replyTo : null),
        replyHash: (replyHash ? replyHash : null),
        visibility: true
    }
    return dataForSave;
}

// isComment is true then this is the first comment
// isComment is false mean this is a reply to some other people's comment
function saveCommentOrReply(dataForSave, isFirstComment) {
    let savedData = {
        author: dataForSave["author"],
        work: dataForSave["work"],
        replyTo: dataForSave["replyTo"], // if it's a comment to a comment...
        replyHash: dataForSave["replyHash"], // ^ (no backend exists for this yet)
        startIndex: dataForSave["startIndex"],
        endIndex: dataForSave["endIndex"],
        commentText: dataForSave["commentText"],
        commentType: isFirstComment ? dataForSave["commentType"] : null, // if this is saving reply type will be null
        visibility: dataForSave["visibility"]
    };
    API.request({
        method: "POST",
        endpoint: "save_comments",
        data: savedData,
        callback: null
    }).then((data) => {
        launchToastNotifcation(data['message']);
        let firstCommentData, type;
        //reply to other user's comment
        if (!isFirstComment) {
            console.log("hu")
            var firstCommentId = $("#replies").attr("data-firstCommentId");
            refreshReplyBox(dataForSave["author"], dataForSave["work"], $(".commented-selection" + "[commentId = '" + firstCommentId + "']").attr("creator"), firstCommentId);
        }
        // the first comment
        else {
            console.log("yo")
            let approved;
            let index = {
                'start': $('.' + escapeSpecialChar(remSpan)).attr("startIndex"),
                'end': $('.' + escapeSpecialChar(remSpan)).attr("endIndex")
            }
            $('.' + escapeSpecialChar(remSpan)).removeAttr('startindex endIndex');
            console.log(data);
            if (data["approval"] == true) {
                approved = true;
            }
            else {
                approved = false;
                $('.' + escapeSpecialChar(remSpan)).addClass("unapprovedComments");
            }
            $('.' + escapeSpecialChar(remSpan)).attr({
                'commentId': data['commentHash'],
                'creator': TMP_STATE.current_user.eppn,
                'typeof': dataForSave['commentType'],
                'approved': approved
            });
            $("<param/>", { class: 'startDiv', commentId: data['commentHash'], startIndex: index["start"], colorId: 0 }).insertBefore('.' + escapeSpecialChar(remSpan));
            $("<param/>", { class: 'endDiv', commentId: data['commentHash'], endIndex: index["end"], colorId: 0 }).insertAfter('.' + escapeSpecialChar(remSpan));
            $('.' + escapeSpecialChar(remSpan)).removeClass(remSpan);
            let allComments = createCommentData();
            handleStartEndDiv(allComments);
            colorNotUsedTypeSelector(dataForSave["author"], dataForSave["work"]);
            updateCommenterSelectors();
            //update the click event on this new added comment
            allowClickOnComment(dataForSave["work"], dataForSave["author"]);
        }
        getUnapprovedComments(dataForSave["author"], dataForSave["work"]);
    });
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

function editOrDelete(dataForEditOrDelete, isEdit) {
    var endPoint;
    var commonData = {
        creator: dataForEditOrDelete["creator"],
        work: dataForEditOrDelete["work"],
        commenter: dataForEditOrDelete["commenter"],
        hash: dataForEditOrDelete["hash"]
    };
    if (isEdit) {
        endPoint = "edit_comment";
        var editData = {
            type: dataForEditOrDelete["type"],
            text: dataForEditOrDelete["text"],
            public: dataForEditOrDelete["public"]
        };
        $.extend(commonData, editData);
    } else {
        endPoint = "delete_comment";
    }
    API.request({
        endpoint: endPoint,
        method: "POST",
        data: commonData,
        callback: null
    }).then((data) => {
        launchToastNotifcation(data);
        var firstCommentId = $("#replies").attr("data-firstCommentId");
        refreshReplyBox(dataForEditOrDelete["creator"], dataForEditOrDelete["work"], $(".commented-selection" + "[commentId = '" + firstCommentId + "']").attr("creator"), firstCommentId, editData["type"]);
        if (isEdit) {
            if (dataForEditOrDelete["type"]) {
                $(".commented-selection" + "[commentId = '" + dataForEditOrDelete["hash"] + "']").attr("typeof", dataForEditOrDelete["type"]);
                colorNotUsedTypeSelector(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
            }
        }
        else {
            //unhighlight the deleted comment
            //update the commenterSelector and the typeSelector
            if (firstCommentId == $("#replies").attr("deletedid")) {
                checkSpansNeedRecover(firstCommentId, removeDeletedSpan);
                updateCommenterSelectors(firstCommentId);
                colorNotUsedTypeSelector(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
                $("#replies").parent().hide();
            }
            else {
                // if the first comment is deleted, no checking required
                // update and mark the unapproved comments
                let firstCommentData = {
                    creator: dataForEditOrDelete["creator"],
                    work: dataForEditOrDelete["work"],
                    commenter: $(".commented-selection" + "[commentId = '" + firstCommentId + "']").attr("creator"),
                    hash: firstCommentId
                }
            }
            allowClickOnComment(dataForEditOrDelete["work"], dataForEditOrDelete["creator"])
            getUnapprovedComments(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
            $("#replies").removeAttr("deletedid");
        }
    });
}

//TODO the id should change
function removeDeletedSpan(id) {
    $(".commented-selection" + "[commentId = '" + id + "']").contents().unwrap();
    $(".startDiv" + "[commentId = '" + id + "']").remove();
    $(".endDiv" + "[commentId = '" + id + "']").remove();
}

//Check if start end div have parent hash
//check if next startDiv startIndex is smaller than the given id's EndDiv endIndex, or prevEndIndex is greater than the given id's startIndex
function checkSpansNeedRecover(id, callback) {
    let currentStartDiv = $(".startDiv" + "[commentId = '" + id + "']");
    let currentStartDivIndex = currentStartDiv.attr("startIndex");
    let currentEndDiv = $(".endDiv" + "[commentId = '" + id + "']");
    let currentEndDivParentHash = currentEndDiv.attr("parentHash");
    let currentEndDivIndex = currentEndDiv.attr("endIndex");
    let prevEndDiv = $(".startDiv" + "[commentId = '" + id + "']").prevAll(".endDiv:first");
    let prevEndDivIndex = prevEndDiv.attr("endIndex");
    let nextStartDiv = $(".endDiv" + "[commentId = '" + id + "']").nextAll(".startDiv:first");
    let nextStartDivIndex = nextStartDiv.attr("startIndex");
    console.log(currentStartDivIndex, prevEndDivIndex, currentEndDivIndex, nextStartDivIndex);
    //if parentHash != undefiend, then recover the parent comment
    if (currentEndDivParentHash != undefined) {
        let parentComment = $(".commented-selection" + "[commentId = '" + currentEndDivParentHash + "']");
        $(".startDiv" + "[commentId = '" + currentEndDivParentHash + "']").nextUntil("endDiv" + "[commentId ='" + currentEndDivParentHash + "']", 'span').each(function () {
            let span = $(this);
            if (span.attr("commentid") == id) {
                span.removeClass().addClass("commented-selection");
                span.attr({
                    "commentid": currentEndDivParentHash,
                    "creator": parentComment.attr("creator"),
                    "typeOf": parentComment.attr("typeOf"),
                    "approved": parentComment.attr("approved")
                });
            }
        });
        callback(id);
        //TODO make the adjacent one to one span
        let pCommentCreator = parentComment.attr("creator");
        let pCommentType = parentComment.attr("typeOf");
        let pCommentApproved = parentComment.attr("approved");
        $(".commented-selection" + "[commentId = '" + currentEndDivParentHash + "']").wrapAll("<span class = 'tempWrap'/>");
        $(".tempWrap").removeClass().addClass("commented-selection").attr({
            "commentid": currentEndDivParentHash,
            "creator": pCommentCreator,
            "typeOf": pCommentType,
            "approved": pCommentApproved
        });
        allowClickOnComment($("#setting").attr("work"), $("#setting").attr("author"));
        getUnapprovedComments($("#setting").attr("author"), $("#setting").attr("work"))
    }
    // unwrap the next comment and recreate it with the highlightText()
    else if (parseInt(nextStartDivIndex) < parseInt(currentEndDivIndex) && nextStartDivIndex != undefined) {
        console.log("cover the one after")
        removeDeletedSpan(id);
        //console.log($(".commented-selection"+"[commentId = '"+nextStartDiv.attr("commentId")+"']"));
        let commentNeedRecover = $(".commented-selection" + "[commentId = '" + nextStartDiv.attr("commentId") + "']");
        let endDivForRecover = $(".endDiv" + "[commentId = '" + nextStartDiv.attr("commentId") + "']");
        let recoverData = {
            startIndex: nextStartDivIndex,
            endIndex: endDivForRecover.attr("endIndex"),
            commentType: commentNeedRecover.attr("typeOf"),
            eppn: commentNeedRecover.attr("creator"),
            hash: commentNeedRecover.attr("commentId"),
            approved: commentNeedRecover.attr("approved")
        }
        console.log(recoverData)
        callback(nextStartDiv.attr("commentId"));
        highlightText(recoverData);
    }
    //unwrap the previous comment and recreate it with highlightText()
    else if (parseInt(prevEndDivIndex) > parseInt(currentStartDivIndex) && prevEndDivIndex != undefined) {
        console.log("cover the one before")
        removeDeletedSpan(id);
        //console.log($(".commented-selection"+"[commentId = '"+prevEndDiv.attr("commentId")+"']"));
        let commentNeedRecover = $(".commented-selection" + "[commentId = '" + prevEndDiv.attr("commentId") + "']");
        let startDivForRecover = $(".startDiv" + "[commentId = '" + prevEndDiv.attr("commentId") + "']");
        let recoverData = {
            startIndex: startDivForRecover.attr("startIndex"),
            endIndex: prevEndDivIndex,
            commentType: commentNeedRecover.attr("typeOf"),
            eppn: commentNeedRecover.attr("creator"),
            hash: commentNeedRecover.attr("commentId"),
            approved: commentNeedRecover.attr("approved")
        }
        callback(prevEndDiv.attr("commentId"));
        highlightText(recoverData);
    }
    else {
        $(".startDiv" + "[parentHash = '" + id + "']").removeAttr("parentHash");
        $(".endDiv" + "[parentHash = '" + id + "']").removeAttr("parentHash");
        callback(id);
    }
    handleStartEndDiv(createCommentData());
}

function exitButtonOnClick() {
    TMP_STATE.quill.setText("");
    //CKEDITOR.instances.textForm.setData("");
    $("#commentExit").text("Exit");
    unhighlight();
    $("#comment-box").parent().fadeOut();
}

// function updateCommentBoxSaveButton(selected_eppn, litId) {
//     $("#commentSave").off().on("click", () => {
//         saveButtonOnClick(selected_eppn, litId);
//     });
// }

//commentBox width: 500 px ,height: 331px , marginX : 10, marginY : 50
function displayCommentBox(evt, selectedType) {
    var marginX = 10;
    var marginY = 50;
    var newPosition = adjustDialogPosition(evt, 500, 331, 10, 50);
    $("#comment-box").parent().css({
        'top': newPosition["newTop"],
        'left': newPosition["newLeft"]
    })
    $("#comment-box").parent().find("#ui-id-1").contents().filter(function () { return this.nodeType == 3; }).first().replaceWith("Annotation by: " + TMP_STATE.current_user['firstname'] + " " + TMP_STATE.current_user['lastname']);
    $("#comment-box").parent().fadeIn();
    if (selectedType != "All" && selectedType != undefined) {
        console.log(selectedType);
        $(".commentTypeDropdown").val(selectedType);
        $('.commentTypeDropdown').attr('disabled', true);
    }
}

function hideCommentBox() {
    $("#comment-box").parent().hide();
}
