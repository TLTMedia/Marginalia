export class ReplyBoxController{
    constructor({ state = state, ui = ui}){
        console.log("InterfaceController/ReplyBoxController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    create_replybox(){
        $("#replies").dialog({
            dialogClass: "no-close",
            use: 'reply',
            modal: true,
            width: 500,
            title: "Comments"
        });
        // Reply Box close button
        var closeReplyBoxDiv = $("<div>", {
            class: "closeReplyBoxDiv"
        })
        var closeReplyBox = $("<button/>", {
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
        $("#replies").parent().find(".ui-dialog-titlebar").prepend(closeReplyBoxDiv);
        $(".closeReplyBox").parent().css({ position: 'relative' });
        $(".closeReplyBox").css({ top: 0, left: 0, position: 'absolute' });
        // Reply Box tips create
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
        $("#replies").parent().find(".ui-dialog-titlebar").append(replyTips);

    }

    createReplies(data_for_replies){
        let eppn = data_for_replies["eppn"];
        let firstName = data_for_replies["firstName"];
        let lastName = data_for_replies["lastName"];
        let public = data_for_replies["public"];
        let type = data_for_replies["type"];
        let commentText = data_for_replies["commentText"];
        let hash = data_for_replies["hash"];
        let approved = data_for_replies["approved"];
        let parentHash = data_for_replies["parentId"];
        let work = data_for_replies["work"];
        let workCreator = data_for_replies["workCreator"];
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
        let toolbar_data = {
            "inText": data_for_replies["inText"],
            "eppn" : data_for_replies["eppn"],
            "hash" : data_for_replies["hash"]
            "hashForReply" : "r"+data_for_replies["hash"],
            "approved" : data_for_replies["approved"],
            "public" : data_for_replies["public"],
            "work" : data_for_replies["work"],
            "workCreator": data_for_replies["workCreator"]
        }
        createToolBar(toolbar_data);
    }

    createToolBar(toolbar_data) {
         let toolBar = $("<div/>", {
             class: "toolBar",
             commentId: toolbar_data["hash"]
         });
         $(".replies" + "[commentid = '" + toolbar_data["hash"] + "']").append(toolBar);
         let replyButton = $("<button/>", {
             class: "replyToComments mdl-button mdl-js-button",
             commentId: toolbar_data["hash"],
             click: (evt) => {
                 $(".select2-save-comment-select").prop("disabled", false);
                 $(".select2-selection").removeClass("disabled_dropDown");
                 replyButtonOnClick(evt, toolbar_data["hash"]);
             }
         });
         replyButton.html("<i class = 'material-icons'> reply </i> <label>Reply</label>");
         let editButton = $("<button/>", {
             class: "editComments mdl-button mdl-js-button",
             commentId: toolbar_data["hash"],
             click: (evt) => {
                 editButtonOnClick(evt, toolbar_data["inText"], toolbar_data["hash"]);
             }
         });
         editButton.html("<i class = 'material-icons'> edit </i> <label>Edit</label>");
         if (toolbar_data["hash"] != "deleted") {
           if (toolbar_data["approved"] && isCurrentUserSelectedUser(toolbar_data["eppn"], false)) {
               toolBar.append(replyButton, editButton);
           }
           else if (toolbar_data["approved"] && !isCurrentUserSelectedUser(toolbar_data["eppn"], false)) {
               toolBar.append(replyButton);
           }
           else if (!toolbar_data["approved"] && isCurrentUserSelectedUser(toolbar_data["eppn"], false)) {
               toolBar.append(editButton);
           }
         }
         createMenuForComment(toolbar_data);
   }

   createMenuForComment(toolbar_data) {
       var commentMenuButton = $("<button/>", {
           class: "commentMenuButton mdl-button mdl-js-button mdl-button--icon",
           id: "m" + toolbar_data["hash"],
           click: () => {
               commentMenuOnClick(toolbar_data["hash"]);
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
           for: "m" + toolbar_data["hash"],
           commentid: toolbar_data["hash"]
       });
       var menuDelete = $("<li/>", {
           class: "deleteComments mdl-menu__item",
           text: "Delete",
           commentid: toolbar_data["hash"],
           click: () => {
               deleteButtonOnClick(toolbar_data["hash"], toolbar_data["eppn"], toolbar_data["work"], toolbar_data["workCreator"]);
           }
       });
       var menuSetPrivate = $("<li/>", {
           class: "setCommentsPrivate mdl-menu__item",
           text: "Set Private",
           commentid: toolbar_data["hash"],
           click: (evt) => {
               commentPrivateButtonOnClick(evt, toolbar_data["work"], toolbar_data["workCreator"], false);
           }
       });
       var menuSetPublic = $("<li/>", {
           class: "setCommentsPublic mdl-menu__item",
           text: "Set Public",
           commentid: toolbar_data["hash"],
           click: (evt) => {
               commentPrivateButtonOnClick(evt, toolbar_data["work"], toolbar_data["workCreator"], true);
           }
       });
       var menuApproveOrUnapprove = $("<li/>", {
           class: "approveComments mdl-menu__item",
           text: !(toolbar_data["approved"]) ? "Approve" : "Unapprove",
           commentid: toolbar_data["hash"],
           click: (evt) => {
               commentApprovedOrUnapprovedButtonOnClick(toolbar_data["hash"], toolbar_data["eppn"], toolbar_data["work"], toolbar_data["workCreator"], toolbar_data["approved"]);
           }
       });

       //comment is approved and currentUser is the comment creator
       if (toolbar_data["approved"] && isCurrentUserSelectedUser(toolbar_data["eppn"], false)) {
           $(menu).append(menuDelete);
           if (isCurrentUserSelectedUser(toolbar_data["workCreator"], false)) {
               $(menu).append(menuApproveOrUnapprove);
           }
           if (toolbar_data["public"]) {
               $(menu).append(menuSetPrivate);
           }
           else {
               $(menu).append(menuSetPublic);
           }
       }
       //comment is approved and currentUser is not the comment creator
       else if (toolbar_data["approved"] && !isCurrentUserSelectedUser(toolbar_data["eppn"], false)) {
           // if the currentUser is the author of the work
           if (isCurrentUserSelectedUser(toolbar_data["workCreator"], false)) {
               $(menu).append(menuApproveOrUnapprove);
           }
       }
       // comment is unapproved and currentUser is the comment creator
       else if (!toolbar_data["approved"]) {
           if ($("#replies").attr("isCurrentUserAdmin") == "true") {
               $(menu).append(menuApproveOrUnapprove, menuDelete);
           }
           else {
               $(menu).append(menuDelete);
           }
       }
       var functionPlane = $(".toolBar" + "[commentId = '" + toolbar_data["hash"] + "']");
       var textSpan = $("#r" + toolbar_data["hash"]);
       if (textSpan.text() != 'deleted' && $(menu).has("li").length != 0) {
           functionPlane.append(commentMenuButton, menu);
       }
       componentHandler.upgradeAllRegistered();
   }


    preload(){

    }

    postload(){

    }
}
