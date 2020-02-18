/**
 * TODO: temporary global to hold our state in non-modularized deprecated functions that can't access state info.
 */
var API;
var TMP_STATE;
//TODO TMP_UI will only be used for the filter update
var TMP_UI;

/*
  Hides the loading symbol
  Loads the userdata obtained by the netID login
  Loads the users folder and creates a button for each user
*/
init = async ({ state = state, ui = ui, api = api }) => {
    /**
     * TODO: For legacy purposes...
     */
    TMP_STATE = state;
    API = api;
    TMP_UI = ui;

    /**
     * API Data object which has references to other Data objects for making API requests
     */
    let api_data = state.api_data;

    /**
     * Set the current user in the state
     */
    state.current_user = await api_data.users_data.get_current_user();

    /**
     * Load & bind initial base events
     */
    ui.base_events.init();

    /**
     * Determine whether the first thing we load is "home" or a doc via deep link
     */
    if (!state.hasOwnProperty("deep_link")) {
        ui.show_home_page();
    } else {
        if (state.deep_link.function == "show_work") {
            // show the sub-menu
            ui.show_sub_menu();

            // hide the main cardbox
            ui.hide_main_cardbox();

            // set the selected creator and work of the work from the deep link
            state.selected_course = decodeURI(state.deep_link.parameters[0]);
            state.selected_creator = state.deep_link.parameters[1];
            state.selected_work = decodeURI(state.deep_link.parameters[2]);

            /**
             * Used to be selectLit, renders the currently selected literature.
             */
            ui.render_literature();
        } else if (state.deep_link.function == "show_home") {
            ui.show_home_page();
        }
    }

    /**
     * Temporarily leave these functions at the bottom of init()
     */
    $(window).on("resize", function () {
        let stageWidth = $(window).width();
        // $("#text-wrapper").css("height", $("#litDiv").height() + "px");
        $("html").css("font-size", (stageWidth / 60) + "px");
    }).trigger("resize");

    /**
     * Prompt if they want to leave the page when clicking on a link in the work
     */
    $(document).ajaxComplete(() => {
        $("a").each(function (_, currentElement) {
            if ($(currentElement).hasClass("redirection-binded")) {
                return;
            } else {
                $(currentElement).addClass("redirection-binded");
                ui.ui_events.bind_redirect_confirmation(currentElement);
            }
        });
    });

    /**
     * Global event necessary to facilitate highlighting, probably should be in its own events file...
     */
    $(document).on("DOMNodeInserted", e => {
        const classes = $(e.target).attr("class");
        if (classes && classes.match(/^hl_/)) {
            $(e.target).addClass("commented-selection");
        }
    });

    /**
     * Initialize all the dropdowns that are from the Select2 library.
     */
    $(document).ready(() => {
        $(".select2-save-comment-select").select2();

        /**
         * Course selection
         */
        $(".select2-course-select").select2({
            placeholder: "Select a course",
        });

        /**
         * User selection
         */
        $(".select2-user-select").select2();

        /**
         * Work selection
         */
        $(".select2-work-select").select2();

        /**
         * Work admin whitelist selection
         */
        $(".select2-whitelist-select").select2({
            multiple: true,
        });

        /**
         * Courses admins whitelist selection
         */
        $(".select2-courses-adminlist-select").select2({
            multiple: true,
        });
    });
}

function createWorkTitle(textChosen) {
    let workTitle = $("<div/>", {
        id: "workTitle"
    });
    let workTitleSpan = $("<span/>", {
        id: "workTitleSpan",
        text: decodeURIComponent(textChosen)
    });
    workTitle.append(workTitleSpan);
    //$("#text").append(workTitle);
    let tips = createTips();
    return [workTitle, tips];
}

function createTips() {
    let tips = $("<div/>", {
        id: "tips"
    });
    let icon = $("<i/>", {
        class: "material-icons tipsIcon",
        text: "help"
    });
    let text = $("<span/>", {
        class: "tipsText"
    });
    text.html("<span style = 'color : #8B0000'>Red</span> comments with underline are unapproved comments.<span style = 'color : #FF4500'>Orange</span> comments are comments with unapproved reply in the thread.")
    tips.append(icon, text);
    return tips
    //workTitle.prepend(tips);
}

//call this function to enable the clickEvent on .commented-selection
function allowClickOnComment(textChosen, selected_eppn) {
    //highlight on top of other's comment will bring them to the reply box
    $(".commented-selection").off().on("click", function (evt) {
        console.log(evt)
        evt.stopPropagation();
        data = {
            "work": textChosen,
            "author": selected_eppn,
            "commentCreator": $(this).attr("creator"),
            "commentId": $(this).attr("commentId"),
            "commentType": $(this).attr("typeof"),
            "evtPageX": evt.pageX,
            "evtPageY": evt.pageY,
            "evtClientY": evt.clientY
        }

        let selectedRange = rangy.getSelection().getRangeAt(0).nativeRange;
        let prevElementClass = evt.target.previousElementSibling.attributes.class.value;
        let prevElementCommentId = evt.target.previousElementSibling.attributes.commentId.value;
        let prevElement = $("." + prevElementClass + "[commentId = '" + prevElementCommentId + "']");

        let prev_curr_divs = {
            "curr_startDiv": undefined,
            "prev_endDiv": undefined,
            "prev_startDiv": undefined
        };
        //prevElement is a startDiv (this will be curr_startDiv)
        if (prevElement.hasClass("startDiv")) {
            prev_curr_divs["curr_startDiv"] = prevElement;
            prev_curr_divs["prev_endDiv"] = prevElement.prev();
            prev_curr_divs["prev_startDiv"] = $(".startDiv" + "[commentId = '" + prev_curr_divs["prev_endDiv"].attr("commentId") + "']");
        }
        //prevElement is a endDiv (this will be prev_endDiv)
        else {
            prev_curr_divs["prev_endDiv"] = prevElement;
            prev_curr_divs["prev_startDiv"] = $(".startDiv" + "[commentId = '" + prev_curr_divs["prev_endDiv"].attr("commentId") + "']");
        }
        console.log(prev_curr_divs)
        let newTextIndex;
        if (prev_curr_divs["curr_startDiv"] == undefined) {
            newTextIndex = parseInt(selectedRange.endOffset) + parseInt(prev_curr_divs["prev_endDiv"].attr("endIndex"));
        }
        else {
            newTextIndex = parseInt(selectedRange.endOffset) + parseInt(prev_curr_divs["curr_startDiv"].attr("startIndex"));
        }
        //clickOnComment(data);
        console.log(newTextIndex)
        clickOnCommentByIndex(newTextIndex, evt);
    });
}

function highlightText({
    startIndex,
    endIndex,
    commentType,
    eppn,
    hash,
    approved
}) {
    let range = rangy.createRange();
    range.selectCharacters(document.getElementById("textSpace"), startIndex, endIndex);
    let area = rangy.createClassApplier("commented-selection", {
        useExistingElements: false,
        elementAttributes: {
            "commentId": hash,
            "creator": eppn,
            "typeof": commentType,
            "approved": approved
        }
    });
    area.applyToRange(range);
    $("<param/>", {
        class: 'startDiv',
        commentId: hash,
        startIndex: startIndex,
        colorId: 0
    }).insertBefore(".commented-selection" + "[commentId = '" + hash + "']");
    $("<param/>", {
        class: 'endDiv',
        commentId: hash,
        endIndex: endIndex,
        colorId: 0
    }).insertAfter(".commented-selection" + "[commentId = '" + hash + "']");
}

function handleStartEndDiv(commentData) {
    handleIncorrectTemplate();
    let sortedCommentData = [];
    console.log(commentData)
    //remove the duplicated startDiv and endDiv
    for (let i = 0; i < commentData.length; i++) {
        let startCount = $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        if (startCount > 1) {
            $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").not(":first").remove();
        }
        let endCount = $(".endDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        if (endCount > 1) {
            $(".endDiv" + "[commentId = '" + commentData[i].hash + "']").not(":last").remove();
        }
        let isStartDivExist = $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        let comment = {
            "hash": commentData[i].hash,
            "startIndex": $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").attr("startIndex"),
            "endIndex": $(".endDiv" + "[commentId = '" + commentData[i].hash + "']").attr("endIndex")
        }
        sortedCommentData = sortCommentsByStartIndex(sortedCommentData, comment);
    }
    //CHANGE New function added for coloring the comments
    set_comments_color(sortedCommentData);
    // for (let i = 0; i < sortedCommentData.length; i++) {
    //     colorOverLappedComments(sortedCommentData[i].hash);
    //     colorAdjacentComments(sortedCommentData[i].hash);
    // }
}

function sortCommentsByStartIndex(sortedCommentData, comment) {
    sortedCommentData.unshift(comment);
    for (var j = 0; j < sortedCommentData.length - 1; j++) {
        let first = parseInt(sortedCommentData[j]["startIndex"], 10);
        let second = parseInt(sortedCommentData[j + 1]["startIndex"], 10);
        if (first > second) {
            let temp = sortedCommentData[j + 1];
            sortedCommentData[j + 1] = sortedCommentData[j];
            sortedCommentData[j] = temp;
        }
    }
    return sortedCommentData;
}

function reverseList(list) {
    let rlist = [];
    for (var i = 0; i < list.length; i++) {
        rlist.unshift(list[i]);
    }
    return rlist;
}

function handleIncorrectTemplate() {
    console.log($(".commented-selection").has('span'));
    let incorrectTemplate = $(".commented-selection").has('span');
    incorrectTemplate.each(function () {
        let span = $(this);
        let incorrectTemplateText = span.text();
        incorrectTemplateText.concat(span.find('span').text());
        span.empty();
        span.html(incorrectTemplateText);
    });
}

//This function do colors the overlapped and adjacent comments
function set_comments_color(sortedCommentData) {
    let data = sortedCommentData.slice(0);
    for (let i in data) {
        let id = data[i]["hash"];
        let si = data[i]["startIndex"];
        let ei = data[i]["endIndex"];
        // comments are already sorted so we don't have to check comments that we already processed
        for (let j = parseInt(i) + 1; j < data.length; j++) {
            let jid = data[j]["hash"];
            let jsi = data[j]["startIndex"];
            let jei = data[j]["endIndex"];
            // j comment is totally inside i comment
            if (parseInt(si) <= parseInt(jsi) && parseInt(ei) >= parseInt(jei)) {
                data[j]["parentId"] = id;
            }
            // j comment's start index is before i's comments end index, but j's end index is after i's end index
            else if (parseInt(jsi) <= parseInt(ei) && parseInt(jei) > parseInt(ei)) {
                data[j]["coverId"] = id;
            }
        }
    }
    console.log(data);
    //colorId 0:normal, 1:colorOneComments, 2:colorTwoComments, 3:colorThreeComments,4: colorFourComments
    let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
    for (let i in data) {
        let id = data[i]["hash"];
        let parentId = data[i]["parentId"];
        let coverId = data[i]["coverId"];
        let goal_color_id;
        if (coverId && parentId) {
            let parent_colorId = parseInt($(".startDiv" + "[commentId ='" + parentId + "']").attr("colorId"));
            let cover_colorId = parseInt($(".startDiv" + "[commentId ='" + coverId + "']").attr("colorId"));
            let bigColorId = Math.max(parent_colorId, cover_colorId);
            let smallColorId = Math.min(parent_colorId, cover_colorId);
            if (bigColorId < 3) {
                goal_color_id = bigColorId + 1;
            }
            else if (bigColorId == 3 && smallColorId != 1) {
                goal_color_id = 1;
            }
            else {
                console.log("special case: \n big:", bigColorId, " small:", smallColorId);
                goal_color_id = 0;
            }
        }
        else if (coverId) {
            let cover_colorId = parseInt($(".startDiv" + "[commentId ='" + coverId + "']").attr("colorId"));
            if (parseInt(cover_colorId) < 3) {
                goal_color_id = cover_colorId + 1;
            }
            else if (parseInt(cover_colorId) == 3) {
                goal_color_id = 1;
            }
        }
        else if (parentId) {
            let parent_colorId = parseInt($(".startDiv" + "[commentId ='" + parentId + "']").attr("colorId"));
            if (parseInt(parent_colorId) < 3) {
                goal_color_id = parent_colorId + 1;
            }
            else if (parseInt(parent_colorId) == 3) {
                goal_color_id = 1;
            }
        }
        else {
            goal_color_id = 0;
        }
        $(".commented-selection" + "[commentId = '" + id + "']").addClass(commentsColorClass[goal_color_id]);
        $(".startDiv" + "[commentId ='" + id + "']").attr({ "parentHash": parentId, "coverId": coverId, "colorId": goal_color_id });
        $(".endDiv" + "[commentId ='" + id + "']").attr({ "parentHash": parentId, "coverId": coverId, "colorId": goal_color_id });
        if (coverId) {
            $(".startDiv" + "[commentId ='" + coverId + "']").attr("backCoverId", id);
            $(".endDiv" + "[commentId ='" + coverId + "']").attr("backCoverId", id);
        }
    }
}


//TODO : new function to replace checkSpansNeedRecover
async function new_span_recover(id){
    // get the list of comments that need to get recovered
    let startIndex = $(".startDiv" + "[commentId ='" + id + "']").attr("startIndex");
    let endIndex = $(".endDiv" + "[commentId ='" + id + "']").attr("endIndex");
    TMP_STATE.recoverDataStart;
    TMP_STATE.recoverDataEnd;
    await API.request({
        endpoint: "comments_within_index",
        method: "GET",
        data: {
            "work": TMP_STATE.selected_work,
            "creator": TMP_STATE.selected_creator,
            "index": startIndex
        }
    }).then((data)=>{
        TMP_STATE.recoverDataStart = data;
    });
    await API.request({
        endpoint: "comments_within_index",
        method: "GET",
        data: {
            "work": TMP_STATE.selected_work,
            "creator": TMP_STATE.selected_creator,
            "index": endIndex
        }
    }).then((data)=>{
        TMP_STATE.recoverDataEnd= data;
    });
    //merge both recover list
    let recover_comments_start = TMP_STATE.recoverDataStart;
    let recover_comments_end = TMP_STATE.recoverDataEnd;
    let raw = [];
    for (let i = 0; i < recover_comments_start.length; i ++){
        raw.push(recover_comments_start[i]);
    }
    for (let i = 0; i < recover_comments_end.length; i ++){
        raw.push(recover_comments_end[i]);
    }
    //remove the duplicate data
    let clean = [];
    for (let i in raw){
        let curr = raw[i];
        let exist = false;
        for(let j in clean){
            if(parseInt(clean[j].hash) == parseInt(curr.hash)){
                exist = true;
            }
        }
        if(!exist){
            clean.push(curr);
        }
    }
    let goal = [];
    for (let i in clean){
        let curr = clean[i];
        let currIndex = 0;
        goal.unshift(curr);
        for (let j in goal){
            if (goal[j].startIndex > curr.startIndex){
                let temp = goal[j];
                goal[j] = goal[currIndex];
                goal[currIndex] = temp;
                currIndex = j;
            }
        }
    }
    console.log(goal);
    removeDeletedSpan(id)
    for (let i in goal){
        removeDeletedSpan(goal[i].hash);
    }
    for (let i in goal){
        let recoverData = {
            startIndex: goal[i].startIndex,
            endIndex: goal[i].endIndex,
            commentType: goal[i].commentType,
            eppn: goal[i].eppn,
            hash: goal[i].hash,
            approved: goal[i].approved
        }
        highlightText(recoverData);
    }
    handleStartEndDiv(createCommentData());
}

//TODO the id should change
function removeDeletedSpan(id) {
    $(".commented-selection" + "[commentId = '" + id + "']").contents().unwrap();
    $(".startDiv" + "[commentId = '" + id + "']").remove();
    $(".endDiv" + "[commentId = '" + id + "']").remove();
}

//TODO logic for checking if comments are overlapped is incorrect
//NOTE: new logic is to just check their index
// function colorOverLappedComments(commentHash) {
//     let prevStartDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".startDiv:first");
//     let nextEndDiv = $(".endDiv" + "[commentId = '" + commentHash + "']").nextAll(".endDiv:first");
//     let prevStartColorId = parseInt(prevStartDiv.attr("colorId"), 10);
//     console.log(commentHash,prevStartDiv.attr("commentId"), nextEndDiv.attr("commentId"), prevStartColorId);
//     //colorId 0:normal, 1:colorOneComments, 2:colorTwoComments, 3:colorThreeComments,4: colorFourComments
//     // if prevStartDiv's commentId is same as the nextEndDiv's commentId, then the current Comment is overlapped with other comment
//     if ((prevStartDiv.attr('commentId') == nextEndDiv.attr("commentId")) && (prevStartDiv.attr('commentId') != undefined)) {
//         //check if this parentComment exist
//         if ($(".commented-selection" + "[commentId = '" + prevStartDiv.attr('commentId') + "']").length != 0) {
//             let startDiv = $(".startDiv" + "[commentId = '" + commentHash + "']");
//             let endDiv = $(".endDiv" + "[commentId = '" + commentHash + "']");
//             startDiv.attr("parentHash", nextEndDiv.attr("commentId"));
//             endDiv.attr("parentHash", nextEndDiv.attr("commentId"));
//             let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
//             if (prevStartColorId < 3) {
//                 $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[(prevStartColorId + 1)]);
//                 startDiv.attr("colorId", prevStartColorId + 1);
//                 endDiv.attr("colorId", prevStartColorId + 1);
//             } else if (prevStartColorId == 3) {
//                 $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
//                 startDiv.attr("colorId", 0);
//                 endDiv.attr("colorId", 0);
//             }
//         }
//     }
// }
//
// function colorAdjacentComments(commentHash) {
//     let prevEndDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".endDiv:first");
//     let prevEndDivData = {
//         "id": prevEndDiv.attr("commentId"),
//         "index": prevEndDiv.attr("endIndex"),
//         "colorId": parseInt(prevEndDiv.attr("colorId"), 10)
//     }
//     let currentStartDivIndex = $(".startDiv" + "[commentId = '" + commentHash + "']").attr("startIndex");
//     let currentEndDivIndex = $(".endDiv" + "[commentId = '" + commentHash + "']").attr("endIndex");
//     if (parseInt(currentStartDivIndex) <= parseInt(prevEndDivData["index"], 10)) {
//         if ($(".commented-selection" + "[commentId = '" + prevEndDivData["id"] + "']").length != 0) {
//             let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
//             if (prevEndDivData["colorId"] < 3) {
//                 $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[prevEndDivData["colorId"] + 1]);
//                 $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
//                 $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
//             } else if (prevEndDivData["colorId"] == 3) {
//                 $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
//                 $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
//                 $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
//             }
//         }
//     }
// }

function filterMultipleComment(api_returned_data, type, commenter) {
    let returned_data = [];
    for (i in api_returned_data) {
        let targetType = 0, targetCommenter = 0;
        if (type != "show-all-types") {
            if (api_returned_data[i]["commentType"].toLowerCase() == type) {
                targetType = true;
            }
        }
        else {
            targetType = true;
        }
        if (commenter != "show-all-eppns") {
            if (api_returned_data[i]["eppn"].split("@")[0] == commenter) {
                targetCommenter = true;
            }
        }
        else {
            targetCommenter = true;
        }
        if (targetType && targetCommenter) {
            returned_data.push(api_returned_data[i]);
        }
    }
    return returned_data;
}


/** TODO this function assumes there is an API that returns all the comments data from the index user clicked
  * if there are more than two comments exist at that index, create a menu of comments (with type and creator)
  *  if (comment.startIndex < textIndex <= comment.endIndex) return this comment
  */
function clickOnCommentByIndex(textIndex, evt) {
    removeCommentContextMenu();
    $("#replies").parent().hide();
    data = {
        "work": TMP_STATE.selected_work,
        "creator": TMP_STATE.selected_creator,
        "index": textIndex
    };

    API.request({
        endpoint: "comments_within_index",
        method: "GET",
        data: data
    }).then((api_returned_data) => {
        console.log(api_returned_data)
        let targetComments = [];
        //api_returned_data include everytype, if the filter is seleceted we remove the different types
        if (TMP_STATE.filters != undefined) {
            let targetType = TMP_STATE.filters.selected_comment_filter, targetCommenter = TMP_STATE.filters.selected_author_filter;
            targetComments = filterMultipleComment(api_returned_data, targetType, targetCommenter);
            console.log(targetComments)
        }
        else {
            targetComments = api_returned_data;
        }
        // more than one comment exist
        if (targetComments.length > 1) {
            let selectedCommentId = evt.currentTarget.attributes.commentId.value;
            let comments = {};
            for (i in targetComments) {
                name = targetComments[i]["eppn"] + " " + targetComments[i]["commentType"];
                let colorId = $(".startDiv" + "[ commentId = " + targetComments[i]["hash"] + "]").attr("colorId");
                let colorClass = { 0: "defaultColorComments", 1: "colorOneComments", 2: "colorTwoComments", 3: "colorThreeComments", 4: "colorFourComments" }
                comments[targetComments[i]["hash"]] = { name: name, className: colorClass[colorId] }
            }
            // add class to the clicked comment
            $(".commented-selection" + "[commentId = " + selectedCommentId + "]").addClass("clicked_span btn btn-neutral");
            $(".clicked_span").append("<span id = 'context_container'><span>");
            let contextMenu = $("#textSpace > p").contextMenu({
                selector: ".clicked_span",
                trigger: "left",
                zIndex: 5,
                appendTo: "#context_container",
                callback: (key, options, e) => {
                    let optionName = e.currentTarget.textContent;
                    let commenter = optionName.split(" ")[0];
                    let id = key;
                    let type = optionName.split(" ")[1];
                    console.log(id, commenter, type);
                    //declare TMP_STATE data first for later use
                    TMP_STATE.commentBox_data;
                    TMP_STATE.replyBox_data;
                    //TOCHECK old codes has this in it
                    $("#replies").empty();
                    //comment_data for get_comment_chain_API_request {creator, work, commenter, hash}
                    let comment_data = {
                        creator: TMP_STATE.selected_creator, // this is the work author/creator
                        work: TMP_STATE.selected_work,
                        commenter: commenter,
                        hash: key
                    };
                    // data_for_replybox {work, author, commentCreator: eppn, commentId: hash, commentType: type, evtPagex, evtPagey, evtCliemtY}
                    let data_for_replybox = {
                        "work": TMP_STATE.selected_work,
                        "author": TMP_STATE.selected_creator,
                        "commentCreator": commenter,
                        "commentId": id,
                        "commentType": type,
                        "evtPageX": evt.pageX,
                        "evtPageY": evt.pageY,
                        "evtClientY": evt.clientY
                    }
                    console.log(comment_data, data_for_replybox);

                    (async () => {
                        let resp = await TMP_STATE.api_data.comments_data.get_comment_chain(comment_data);
                        readThreads(resp);
                    })();
                    removeCommentContextMenu();
                    TMP_UI.replybox_controller.displayReplyBox(data_for_replybox);
                },
                items: comments,
            });
            $("#context_container > *").show();
        }
        // only one comment exist
        else {
            $("#replies").empty();
            TMP_STATE.commentBox_data;
            TMP_STATE.replyBox_data;
            let comment_data = {
                creator: TMP_STATE.selected_creator, // this is the work author/creator
                work: TMP_STATE.selected_work,
                commenter: targetComments[0]["eppn"],
                hash: targetComments[0]["hash"]
            };
            let data_for_replybox = {
                "work": TMP_STATE.selected_work,
                "author": TMP_STATE.selected_creator,
                "commentCreator": targetComments[0]["eppn"],
                "commentId": targetComments[0]["hash"],
                "commentType": targetComments[0]["commentType"],
                "evtPageX": evt.pageX,
                "evtPageY": evt.pageY,
                "evtClientY": evt.clientY
            };

            (async () => {
                let resp = await TMP_STATE.api_data.comments_data.get_comment_chain(comment_data);
                readThreads(resp);
            })();

            TMP_UI.replybox_controller.displayReplyBox(data_for_replybox);
        }
    });
}

function removeCommentContextMenu() {
    $(".clicked_span").removeClass("clicked_span btn btn-neutral");
    $("#context_container").remove();
}


// function getUnapprovedComments(workCreator = TMP_STATE.selected_creator, work = TMP_STATE.selected_work) {
//     //remove the unapproved classes
//     $(".commented-selection").removeClass("unapprovedComments threadNotApproved");
//     API.request({
//         endpoint: "unapproved_comments",
//         method: "GET",
//         data: {
//             creator: workCreator,
//             work: work,
//         },
//     }).then((data) => {
//         console.log(data);
//         data.forEach((data) => {
//             let ancesHash = data["AncestorHash"];
//             let hash = data["CommentHash"];
//             //console.log("for unaproved ",ancesHash,hash);
//             //the first Level is unapproved
//             if (ancesHash == hash) {
//                 $(".commented-selection" + "[commentId = '" + hash + "']").addClass("unapprovedComments");
//             } else {
//                 $(".commented-selection" + "[commentId = '" + ancesHash + "']").addClass("threadNotApproved");
//             }
//         });
//     });
// }

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, work = TMP_STATE.selected_work, workCreator = TMP_STATE.selected_creator, parentId = null) {
    if (threads.length == 0) {
        return;
    } else {
        for (let i = 0; i < threads.length; i++) {
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
            };

            TMP_UI.replybox_controller.createReplies(dataForReplies);
            readThreads(threads[i].threads, work, workCreator, threads[i].hash);
        }
    }
}

//TODO add the hidden comments also
//do the same thing as the commented-selection.length!=0 comment
function createCommentData() {
    let comments = $(".commented-selection");
    let commentData = [];
    for (var i = 0; i < comments.length; i++) {
        let commentHash = comments[i]['attributes']['commentId']['value'];
        let c = {
            hash: commentHash
        }
        let commentExist = false;
        for (var j = 0; j < commentData.length; j++) {
            if (commentData[j].hash == commentHash) {
                commentExist = true;
            }
        }
        if (!commentExist) {
            commentData.push(c);
        }
    }
    return commentData;
}

// this function only check if the selected_eppn is same as the current user or not
function isCurrentUserSelectedUser(selected_eppn, needNotification) {
    if (selected_eppn == TMP_STATE.current_user.eppn) {
        return true;
    } else {
        if (needNotification) {
            launchToastNotifcation("You don't have permission to do this action");
        }
        return false;
    }
}

//TODO remove this function and move it to 
function launchToastNotifcation(data) {
    let message = {
        message: data,
    };
    let snackbarContainer = document.querySelector('.mdl-js-snackbar');
    snackbarContainer.MaterialSnackbar.showSnackbar(message);
    snackbarContainer.MaterialSnackbar.showSnackbar(message);
}

// Make sure the dialog don't exceed the window
function adjustDialogPosition(data, width, height, marginX, marginY) {
    let newLeft = (data["evtPageX"] - marginX) + "px";
    let newTop = (data["evtPageY"] + marginY) + "px";
    if (data["evtClientY"] + (marginY + height) > $(window).height()) {
        newTop = (data["evtPageY"] - (marginY + height)) + "px";
    }

    if (data["evtPageX"] + width > $(window).width()) {
        newLeft = $(window).width() - (width + marginX) + "px";
    }

    return {
        newTop,
        newLeft,
    };
}

function escapeSpecialChar(id) {
    if (id == null) {
        return null;
    }

    return id.replace(/([\s!"#$%&'()\*+,\.\/:;<=>?@\[\]^`{|}~])/g, "\\$1");
}

function escapeHTMLPtag(text) {
    return text.replace(/<p>(.*)<\/p>/, ` $1\n`);
}

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
    $("[aria-describedby='replies']").hide();
    $("[aria-describedby='comment-box']").hide();
}
