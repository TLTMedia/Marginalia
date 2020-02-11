//edit_comment_id is the comment id that we are going to edit. If this is a delete action edit_comment_id is undefined
// function editOrDelete(dataForEditOrDelete, edit_comment_id) {
//     var endPoint;
//     var commonData = {
//         creator: dataForEditOrDelete["creator"],
//         work: dataForEditOrDelete["work"],
//         commenter: dataForEditOrDelete["commenter"],
//         hash: dataForEditOrDelete["hash"]
//     };
//     if (edit_comment_id) {
//         endPoint = "edit_comment";
//         var editData = {
//             type: dataForEditOrDelete["type"],
//             text: dataForEditOrDelete["text"],
//             public: dataForEditOrDelete["public"]
//         };
//         $.extend(commonData, editData);
//     }
//     else {
//         endPoint = "delete_comment";
//     }
//     API.request({
//         endpoint: endPoint,
//         method: "POST",
//         data: commonData,
//         callback: null
//     }).then((data) => {
//         launchToastNotifcation(data);
//         let firstCommentId = TMP_STATE.replyBox_data.first_comment_id;
//         let firstCommentCreator = TMP_STATE.replyBox_data.first_comment_author;
//         refreshReplyBox(dataForEditOrDelete["creator"], dataForEditOrDelete["work"], firstCommentCreator, firstCommentId, editData != undefined ? editData["type"] : undefined);
//         if (edit_comment_id) {
//             if (dataForEditOrDelete["type"]) {
//                 $(".commented-selection" + "[commentId = '" + dataForEditOrDelete["hash"] + "']").attr("typeof", dataForEditOrDelete["type"]);
//                 let work_comment_data = TMP_STATE.api_data.comments_data.get_work_highlights();
//                 console.log(work_comment_data)
//                 colorNotUsedTypeSelector(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
//             }
//         }
//         else {
//             //unhighlight the deleted comment
//             //update the commenterSelector and the typeSelector
//             console.log(firstCommentId, TMP_STATE.replyBox_data.delete_comment_id);
//             if (firstCommentId == TMP_STATE.replyBox_data.delete_comment_id) {
//                 checkSpansNeedRecover(firstCommentId, removeDeletedSpan);
//                 updateCommenterSelectors(firstCommentId);
//                 colorNotUsedTypeSelector(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
//                 $("#replies").parent().hide();
//             }
//             else {
//                 // if the first comment is deleted, no checking required
//                 // update and mark the unapproved comments
//                 let firstCommentData = {
//                     creator: dataForEditOrDelete["creator"],
//                     work: dataForEditOrDelete["work"],
//                     commenter: $(".commented-selection" + "[commentId = '" + firstCommentId + "']").attr("creator"),
//                     hash: firstCommentId
//                 }
//             }
//             allowClickOnComment(dataForEditOrDelete["work"], dataForEditOrDelete["creator"])
//             getUnapprovedComments(dataForEditOrDelete["creator"], dataForEditOrDelete["work"]);
//             delete TMP_STATE.replyBox_data.delete_comment_id;
//             $("#replies").removeAttr("deletedid");
//         }
//     });
// }

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
        allowClickOnComment(TMP_STATE.selected_work, TMP_STATE.selected_creator);
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

//commentBox width: 500 px ,height: 331px , marginX : 10, marginY : 50
// function displayCommentBox(evt, selected_filter) {
//     var marginX = 10;
//     var marginY = 50;
//     var newPosition = adjustDialogPosition(evt, 500, 331, 10, 50);
//
//     $("#comment-box").parent().css({
//         'top': newPosition["newTop"],
//         'left': newPosition["newLeft"],
//         'z-index': 5
//     })
//
//     $("#comment-box").parent().find("#ui-id-1").contents().filter(function () { return this.nodeType == 3; }).first().replaceWith("Annotation by: " + TMP_STATE.current_user['firstname'] + " " + TMP_STATE.current_user['lastname']);
//     $("#comment-box").parent().fadeIn();
//
//     if (selected_filter != "show-all-types" && selected_filter !== undefined) {
//         let val_selected = selected_filter.charAt(0).toUpperCase() + selected_filter.slice(1);
//
//         $(".select2-save-comment-select").val(val_selected).trigger("change");
//         $(".select2-save-comment-select").prop("disabled", true);
//     }
//     TMP_STATE.commentBox_data;
//     console.log(TMP_STATE)
// }
