/**
 * These globals are temporary until javascript is refactored into modules
 * TODO: I need to check to see where these are used... I don't even know if they still are.
 */
var remSpan; // holds the name of made and clicked spans

/**
 * TODO: temporary global to hold our state in non-modularized deprecated functions that can't access state info.
 */
var API;
var TMP_STATE;

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

    $("#tutorial").off().on("click", () => {
        ui.show_tutorial();
    })

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
}

// Creates a visual list of all users which gives access to their folders
/*
  Loads the user's works folder and creates a button for each work they have
  When the button is clicked the variable userFolderSelected is the work's name
  The cooresponding work then has it's text and comment/reply data loaded
*/
function buildHTMLFile(litContents, selected_eppn, textChosen) {
    console.log(selected_eppn, textChosen)

    /**
     * Make the comment box,
     * TODO: this stuff breaks if it was already made, so find a way to only make these boxes once.
     */
    makeDraggableCommentBox(selected_eppn, textChosen);
    makeDraggableReplyBox();
    hideAllBoxes();

    loadUserComments(selected_eppn, textChosen);
    let footer;
    let titleAndTip = createWorkTitle(textChosen);

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
    litDiv.append(metaChar, metaName, link, preText);
    titleAndTip[0].prepend(titleAndTip[1]);
    $("#text").append(titleAndTip[0], litDiv);
    $("#text").append(footer);
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



function makeDropDown() {
    let buttonTypes = ['Historical', 'Analytical', 'Comment', 'Definition', 'Question'];
    dropdown = $("<select>", {
        class: "commentTypeDropdown",
    });
    buttonTypes.forEach((type) => {
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

loadUserComments = (selected_eppn, textChosen, selectedType, selectedCommenter) => {
    if (selectedCommenter !== undefined) {
        if (selectedCommenter.indexOf("@") == -1 && selectedCommenter != "show-all-eppns") {
            selectedCommenter += "@stonybrook.edu"
        }
    }


    let endpoint, data;
    let isTypeAndCommenterUndefiend = (selectedType == undefined && selectedCommenter == undefined);

    if (isTypeAndCommenterUndefiend) {
        $("#text-wrapper").hide();
        $("#textSpace").hide();
        endpoint = "get_highlights";
        data = {
            creator: selected_eppn,
            work: textChosen
        }
    }
    // only reach here when selectorOnSelect() is called
    else {
        console.log(selectedType, selectedCommenter)
        endpoint = "get_highlights_filtered";
        data = {
            creator: selected_eppn,
            work: textChosen,
            filterEppn: selectedCommenter == "show-all-eppns" ? "" : selectedCommenter,
            filterType: selectedType == "show-all-types" ? "" : selectedType
        }
    }

    API.request({
        endpoint: endpoint,
        data: data
    }).then((data) => {
        let sortedCommentData = [];

        for (var i = 0; i < data.length; i++) {
            let comment = data[i];
            sortedCommentData = sortCommentsByStartIndex(sortedCommentData, comment);
        }

        // reverse the list so the comments are created by the order of the startIndex. (bigger startIndex get created first)
        reverseSortedCommentData = reverseList(sortedCommentData);
        console.log(reverseSortedCommentData);

        renderComments(reverseSortedCommentData, selected_eppn, textChosen, getUnapprovedComments);

        if (isTypeAndCommenterUndefiend) {
            // TODO: READ IT ALL. pass in the highlights and parse out the comment authors & the comment types (disable those not available)
            //makeSelector(selected_eppn, textChosen, reverseSortedCommentData, colorNotUsedTypeSelector);
        }
    });
}

//selected_eppn : work creator
//textChosen : work Name
renderComments = (commentData, selected_eppn, textChosen, callback) => {
    $("#text-wrapper").fadeIn();
    $("#textSpace").fadeIn();

    for (let i = 0; i < commentData.length; i++) {
        highlightText({
            startIndex: commentData[i].startIndex,
            endIndex: commentData[i].endIndex,
            commentType: commentData[i].commentType,
            eppn: commentData[i].eppn,
            hash: commentData[i].hash,
            approved: commentData[i].approved,
        });
    }
    handleStartEndDiv(commentData);
    // $("#text").css("height", $("#litDiv").height() + "px");
    //highlight to post comments

    $("#litDiv").off().on("mousedown", () => {
        TMP_STATE.select_valid = true;
    });

    $("#litDiv").on("mouseup", function (evt) {
        if (TMP_STATE.select_valid == true) {
            // the next time they highlight it must start with a mousedown in #litDiv
            TMP_STATE.select_valid = false;

            //TODO this is triggered everytime when we click on a comment need to fix this
            console.log(evt)
            if (evt["target"]["classList"][0] == "commented-selection") {
                // launchToastNotifcation("You are not allowed to highlight inside someone's comment.");
                // launchToastNotifcation("If you want to start another kind of discussion, please use the filter first.");
            } else {
                let selectedType = $("#typeSelector").attr("currentTarget");
                console.log(selectedType)
                highlightCurrentSelection(evt, selectedType);
            }
        }
    });

    allowClickOnComment(textChosen, selected_eppn);
    callback(selected_eppn, textChosen);
}
//call this function to enable the clickEvent on .commented-selection
function allowClickOnComment(textChosen, selected_eppn) {
    //highlight on top of other's comment will bring them to the reply box
    $(".commented-selection").off().on("click", function (evt) {
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
        clickOnComment(data);
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
            // "startIndex":  isStartDivExist!=0 ? $(".startDiv"+"[commentId = '"+commentData[i].hash+"']").attr("startIndex") : $(".hiddenDiv"+"[commentId = '"+commentData[i].hash+"']").attr("startIndex")'
            "startIndex": $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").attr("startIndex")
        }
        sortedCommentData = sortCommentsByStartIndex(sortedCommentData, comment);
    }
    console.log(sortedCommentData)
    //assign parent hash
    for (let i = 0; i < sortedCommentData.length; i++) {
        colorOverLappedComments(sortedCommentData[i].hash);
        colorAdjacentComments(sortedCommentData[i].hash);
    }
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


function colorOverLappedComments(commentHash) {
    let prevStartDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".startDiv:first");
    let nextEndDiv = $(".endDiv" + "[commentId = '" + commentHash + "']").nextAll(".endDiv:first");
    let prevStartColorId = parseInt(prevStartDiv.attr("colorId"), 10);
    //colorId 0:normal, 1:colorOneComments, 2:colorTwoComments, 3:colorThreeComments,4: colorFourComments
    if ((prevStartDiv.attr('commentId') == nextEndDiv.attr("commentId")) && (prevStartDiv.attr('commentId') != undefined)) {
        if ($(".commented-selection" + "[commentId = '" + prevStartDiv.attr('commentId') + "']").length != 0) {
            let startDiv = $(".startDiv" + "[commentId = '" + commentHash + "']");
            let endDiv = $(".endDiv" + "[commentId = '" + commentHash + "']");
            startDiv.attr("parentHash", nextEndDiv.attr("commentId"));
            endDiv.attr("parentHash", nextEndDiv.attr("commentId"));
            let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
            if (prevStartColorId < 3) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[(prevStartColorId + 1)]);
                startDiv.attr("colorId", prevStartColorId + 1);
                endDiv.attr("colorId", prevStartColorId + 1);
            } else if (prevStartColorId == 3) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
                startDiv.attr("colorId", 0);
                endDiv.attr("colorId", 0);
            }
        }
    }
}

function colorAdjacentComments(commentHash) {
    let prevEndDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".endDiv:first");
    let prevEndDivData = {
        "id": prevEndDiv.attr("commentId"),
        "index": prevEndDiv.attr("endIndex"),
        "colorId": parseInt(prevEndDiv.attr("colorId"), 10)
    }
    let currentStartDivIndex = $(".startDiv" + "[commentId = '" + commentHash + "']").attr("startIndex");
    let currentEndDivIndex = $(".endDiv" + "[commentId = '" + commentHash + "']").attr("endIndex");
    if (currentStartDivIndex <= parseInt(prevEndDivData["index"], 10)) {
        if ($(".commented-selection" + "[commentId = '" + prevEndDivData["id"] + "']").length != 0) {
            let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
            if (prevEndDivData["colorId"] < 3) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[prevEndDivData["colorId"] + 1]);
                $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
                $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
            } else if (prevEndDivData["colorId"] == 3) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
                $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
                $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
            }
        }
    }
}

//if current user is admin for the current work, they are able to approve the unapproved comments
//if current user is creator of the comment, they are able to edit and delete the unapproved comment
//approved comments don't need to check anyPermission stuff
function clickOnComment(data) {
    $("#replies").empty();
    $("#comment-box").removeAttr("data-replyToEppn");
    $("#comment-box").removeAttr("data-replyToHash");
    $("#comment-box").attr("data-editCommentId", "-1");
    let comment_data = {
        creator: data["author"],
        work: data["work"],
        commenter: data["commentCreator"],
        hash: data["commentId"]
    };
    get_comment_chain_API_request(comment_data);
    displayReplyBox(data);
}

function getUnapprovedComments(workCreator, work) {
    //remove the unapproved classes
    $(".commented-selection").removeClass("unapprovedComments threadNotApproved");
    API.request({
        endpoint: "unapproved_comments",
        method: "GET",
        data: {
            creator: workCreator,
            work: work,
        },
    }).then((data) => {
        console.log(data);
        data.forEach((data) => {
            let ancesHash = data["AncestorHash"];
            let hash = data["CommentHash"];
            //console.log("for unaproved ",ancesHash,hash);
            //the first Level is unapproved
            if (ancesHash == hash) {
                $(".commented-selection" + "[commentId = '" + hash + "']").addClass("unapprovedComments");
            } else {
                $(".commented-selection" + "[commentId = '" + ancesHash + "']").addClass("threadNotApproved");
            }
        });
    });
}

function get_comment_chain_API_request(jsonData) {
    let work = jsonData.work;
    let workCreator = jsonData.creator;
    API.request({
        endpoint: "get_comment_chain",
        data: jsonData,
        method: "GET"
    }).then((data) => {
        console.log(data);
        readThreads(data, work, workCreator);
    });
}

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, work, workCreator, parentId = null) {
    if (threads.length == 0) {
        return;
    } else {
        for (var i = 0; i < threads.length; i++) {
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

function createListOfCommenter(data) {
    var commenters = [];
    if (data.length) {
        commenters.push(data[0].eppn);
        for (var i = 1; i < data.length; i++) {
            var eppn = data[i].eppn;
            var eppnExist = false;
            for (var j = 0; j < commenters.length; j++) {
                if (commenters[j] == eppn) {
                    eppnExist = true;
                }
            }
            if (!eppnExist)
                commenters.push(eppn);
        }
    }
    return commenters;
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

//TODO this only blocks the Setting button:    mode = setting, mode = approvedComments
//need to update this function with other things that need to check if user is in whiteList
//ex: approve comments
function checkworkAdminList(selected_eppn, litId, mode) {
    var endPoint = "get_permissions_list";
    API.request({
        endpoint: endPoint,
        method: "GET",
        data: {
            eppn: selected_eppn,
            work: litId,
        }
    }).then((data) => {
        let isInWhiteList = false
        for (var i = 0; i < data["admins"].length; i++) {
            if (TMP_STATE.current_user.eppn == data["admins"][i]) {
                isInWhiteList = true;
                console.log(TMP_STATE.current_user.eppn, " in admins");
            }
        }
        if (!isInWhiteList) {
            if (mode == "approvedComments") {
                $("#replies").attr("isCurrentUserAdmin", false);
            }
        } else {
            if (mode == "approvedComments") {
                $("#replies").attr("isCurrentUserAdmin", true);
            }
        }
    });
}

function launchToastNotifcation(data) {
    var message = {
        message: data
    }
    var snackbarContainer = document.querySelector('.mdl-js-snackbar');
    snackbarContainer.MaterialSnackbar.showSnackbar(message);
}

//Make sure the dialog don't exceed the window
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
        newLeft
    }
}

//fucntions that were made by ppl before
//------------------------------------------------------------------------------

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
    $("[aria-describedby='replies']").hide();
    $("[aria-describedby='comment-box']").hide();
}
