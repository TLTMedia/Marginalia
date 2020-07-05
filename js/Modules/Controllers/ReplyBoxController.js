export class ReplyBoxController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/ReplyBoxController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    create_replybox() {
        $("#replies").dialog({
            dialogClass: "no-close",
            use: "reply",
            modal: true,
            width: 500,
            title: "Comments",
        });
        // Reply Box close button
        var closeReplyBoxDiv = $("<div>", {
            class: "closeReplyBoxDiv",
        });
        var closeReplyBox = $("<button/>", {
            class: "closeReplyBox",
            click: function () {
                $("#replies").parent().fadeOut();
            },
        });
        var closeReplyBoxIcon = $("<i>", {
            class: "material-icons closeReplyBoxIcon",
            text: "highlight_off",
        });
        closeReplyBox.append(closeReplyBoxIcon);
        closeReplyBoxDiv.append(closeReplyBox);
        $("#replies")
            .parent()
            .find(".ui-dialog-titlebar")
            .prepend(closeReplyBoxDiv);
        $(".closeReplyBox").parent().css({ position: "relative" });
        $(".closeReplyBox").css({ top: 0, left: 0, position: "absolute" });
        // Reply Box tips create
        var replyTips = $("<div>", {
            class: "replyBoxTips",
        });
        var replyTipsIcon = $("<i/>", {
            class: "material-icons replyBoxTipsIcon",
            text: "help",
        });
        var replyTipsText = $("<span>", {
            class: "replyBoxTipsText",
        });
        replyTipsText.html(
            "The <span style = 'color: blue'>Blue</span> comments with<i class = 'material-icons lock'>lock</i>icon are private comments.\n The <span style = 'color : grey'>Grey</span> comments with <i class = 'material-icons unapproved'>hourglass_full</i> icon are unapproved commments"
        );
        replyTips.append(replyTipsIcon, replyTipsText);
        $("#replies").parent().find(".ui-dialog-titlebar").append(replyTips);
    }

    createReplies(data_for_replies) {
        let eppn = data_for_replies["eppn"];
        let firstName = data_for_replies["firstName"];
        let lastName = data_for_replies["lastName"];
        let isPublic = data_for_replies["public"];
        let type = data_for_replies["type"];
        let commentText = data_for_replies["commentText"];
        let hash = data_for_replies["hash"];
        let approved = data_for_replies["approved"];
        let parentHash = data_for_replies["parentId"];
        let work = data_for_replies["work"];
        let workCreator = data_for_replies["workCreator"];
        var userName = firstName + " " + lastName;
        var hashForReply = "r" + hash;
        var inText = atob(unescape(decodeURIComponent(commentText)));
        var repliesClass;
        var repliesSpan;
        //check if this relpy is deleted
        if (firstName == "deleted" && lastName == "deleted") {
            repliesSpan =
                "<span class = 'replyText' id = '" +
                hashForReply +
                "'>" +
                inText +
                "</span>";
            repliesClass = "replies deleted";
        } else {
            if (!approved) {
                repliesSpan =
                    "<span class = 'replyText' id = '" +
                    hashForReply +
                    "'><span class='commentAuthorLink'>" +
                    userName +
                    "</span> " +
                    inText +
                    "<i class = 'material-icons unapproved'>hourglass_full</i></span>";
                repliesClass = "replies unapproved";
            } else {
                if (!isPublic) {
                    repliesSpan =
                        "<span class = 'replyText' id = '" +
                        hashForReply +
                        "'><span class='commentAuthorLink'>" +
                        userName +
                        "</span> " +
                        inText +
                        "<i class = 'material-icons lock'>lock</i></span>";
                    repliesClass = "replies private";
                } else {
                    repliesSpan =
                        "<span class = 'replyText' id = '" +
                        hashForReply +
                        "'><span class='commentAuthorLink'>" +
                        userName +
                        "</span> " +
                        inText +
                        "</span>";
                    repliesClass = "replies";
                }
            }
        }
        var replyBox = $("<div/>", {
            class: repliesClass,
            commentid: hash,
            name: eppn,
            haschild: 0,
            type: type,
        });
        replyBox.html(repliesSpan);

        // this reply has a parent
        if (parentHash != null) {
            $(".replies" + "[commentid = '" + parentHash + "']").append(
                replyBox
            );
            $(".replies" + "[commentid = '" + parentHash + "']").attr(
                "haschild",
                "1"
            );
            //shows the deleted reply if it has a child
            if (
                $(".replies" + "[commentid = '" + parentHash + "']").attr(
                    "haschild"
                ) == 1
            ) {
                $(".replies" + "[commentid = '" + parentHash + "']").show();
            }
        }
        // this reply doesn't have a parent (first Comment)
        else {
            $("#replies").append(replyBox);
            $("#r" + hash).addClass("firstComment");
        }

        let toolbar_data = {
            inText: inText,
            eppn: eppn,
            hash: hash,
            hashForReply: hashForReply,
            approved: approved,
            public: isPublic,
            work: work,
            workCreator: workCreator,
        };
        this.createToolBar(toolbar_data);
    }

    createToolBar(toolbar_data) {
        let toolBar = $("<div/>", {
            class: "toolBar",
            commentId: toolbar_data["hash"],
        });
        $(".replies" + "[commentid = '" + toolbar_data["hash"] + "']").append(
            toolBar
        );
        let replyButton = $("<button/>", {
            class: "replyToComments mdl-button mdl-js-button",
            commentId: toolbar_data["hash"],
            click: (evt) => {
                $(".select2-save-comment-select").prop("disabled", false);
                $(".select2-selection").removeClass("disabled_dropDown");
                this.replyButtonOnClick(evt, toolbar_data["hash"]);
            },
        });
        replyButton.html(
            "<i class = 'material-icons'> reply </i> <label>Reply</label>"
        );
        let editButton = $("<button/>", {
            class: "editComments mdl-button mdl-js-button",
            commentId: toolbar_data["hash"],
            click: (evt) => {
                this.editButtonOnClick(
                    evt,
                    toolbar_data["inText"],
                    toolbar_data["hash"]
                );
            },
        });
        editButton.html(
            "<i class = 'material-icons'> edit </i> <label>Edit</label>"
        );
        if (
            !$(
                ".replies" + "[commentId = " + toolbar_data["hash"] + "]"
            ).hasClass("deleted")
        ) {
            if (
                toolbar_data["approved"] &&
                isCurrentUserSelectedUser(toolbar_data["eppn"], false)
            ) {
                toolBar.append(replyButton, editButton);
            } else if (
                toolbar_data["approved"] &&
                !isCurrentUserSelectedUser(toolbar_data["eppn"], false)
            ) {
                toolBar.append(replyButton);
            } else if (
                !toolbar_data["approved"] &&
                isCurrentUserSelectedUser(toolbar_data["eppn"], false)
            ) {
                toolBar.append(editButton);
            }
        }
        this.createMenuForComment(toolbar_data);
    }

    createMenuForComment(toolbar_data) {
        var commentMenuButton = $("<button/>", {
            class:
                "commentMenuButton mdl-button mdl-js-button mdl-button--icon",
            id: "m" + toolbar_data["hash"],
            click: () => {
                this.commentMenuOnClick(toolbar_data["hash"]);
            },
        });
        var icon = $("<i/>", {
            class: "material-icons",
            text: "more_vert",
        });
        $(commentMenuButton).append(icon);
        //create Buttons
        var menu = $("<ul/>", {
            class: "commentMenu mdl-menu--bottom-right mdl-menu mdl-js-menu",
            for: "m" + toolbar_data["hash"],
            commentid: toolbar_data["hash"],
        });
        var menuDelete = $("<li/>", {
            class: "deleteComments mdl-menu__item",
            text: "Delete",
            commentid: toolbar_data["hash"],
            click: () => {
                this.deleteButtonOnClick(
                    toolbar_data["hash"],
                    toolbar_data["eppn"],
                    toolbar_data["work"],
                    toolbar_data["workCreator"]
                );
            },
        });
        var menuSetPrivate = $("<li/>", {
            class: "setCommentsPrivate mdl-menu__item",
            text: "Set Private",
            commentid: toolbar_data["hash"],
            click: (evt) => {
                this.commentPrivateButtonOnClick(
                    evt,
                    toolbar_data["work"],
                    toolbar_data["workCreator"],
                    false
                );
            },
        });
        var menuSetPublic = $("<li/>", {
            class: "setCommentsPublic mdl-menu__item",
            text: "Set Public",
            commentid: toolbar_data["hash"],
            click: (evt) => {
                this.commentPrivateButtonOnClick(
                    evt,
                    toolbar_data["work"],
                    toolbar_data["workCreator"],
                    true
                );
            },
        });
        var menuApproveOrUnapprove = $("<li/>", {
            class: "approveComments mdl-menu__item",
            text: !toolbar_data["approved"] ? "Approve" : "Unapprove",
            commentid: toolbar_data["hash"],
            click: (evt) => {
                this.commentApprovedOrUnapprovedButtonOnClick(
                    toolbar_data["hash"],
                    toolbar_data["eppn"],
                    toolbar_data["work"],
                    toolbar_data["workCreator"],
                    toolbar_data["approved"]
                );
            },
        });

        //comment is approved and currentUser is the comment creator
        if (
            toolbar_data["approved"] &&
            isCurrentUserSelectedUser(toolbar_data["eppn"], false)
        ) {
            $(menu).append(menuDelete);
            if (isCurrentUserSelectedUser(toolbar_data["workCreator"], false)) {
                $(menu).append(menuApproveOrUnapprove);
            }
            if (toolbar_data["public"]) {
                $(menu).append(menuSetPrivate);
            } else {
                $(menu).append(menuSetPublic);
            }
        }
        //comment is approved and currentUser is not the comment creator
        else if (
            toolbar_data["approved"] &&
            !isCurrentUserSelectedUser(toolbar_data["eppn"], false)
        ) {
            // if the currentUser is the author of the work
            if ($("#replies").attr("isCurrentUserAdmin") == "true") {
                $(menu).append(menuApproveOrUnapprove);
            }
        }
        // comment is unapproved and currentUser is the comment creator
        else if (!toolbar_data["approved"]) {
            if ($("#replies").attr("isCurrentUserAdmin") == "true") {
                $(menu).append(menuApproveOrUnapprove, menuDelete);
            } else {
                $(menu).append(menuDelete);
            }
        }
        var functionPlane = $(
            ".toolBar" + "[commentId = '" + toolbar_data["hash"] + "']"
        );
        var textSpan = $("#r" + toolbar_data["hash"]);
        if (textSpan.text() != "deleted" && $(menu).has("li").length != 0) {
            functionPlane.append(commentMenuButton, menu);
        }
        componentHandler.upgradeAllRegistered();
    }

    commentMenuOnClick(rid) {
        $(".commentMenu").hide();
        $(".commentMenu" + "[commentid = '" + rid + "']").show();
        $("#commentSave").show();
        $("#commentExit").text("Exit");
        $(".commentMenu").children("li").hide();
        $(".commentMenu")
            .children("li" + "[commentid = '" + rid + "']")
            .show();
        // CKEDITOR.instances.textForm.setReadOnly(false);
        this.state.quill.enable();
    }

    replyButtonOnClick(evt, hash) {
        var replyToEppn = $(".replies" + "[commentid = '" + hash + "']").attr(
            "name"
        );

        this.state.commentBox_data = {
            eppn_to_reply_to: replyToEppn,
            hash_to_reply_to: hash,
        };
        delete this.state.commentBox_data.edit_comment_id;

        this.state.quill.setText("");
        var first_comment_id = this.state.replyBox_data.first_comment_id;
        this.ui.commentbox_controller.displayCommentBox(
            evt,
            $(
                ".commented-selection" +
                    "[commentId = '" +
                    first_comment_id +
                    "']"
            ).attr("typeof")
        );
    }

    editButtonOnClick(evt, inText, hash) {
        this.state.commentBox_data = {
            edit_comment_id: hash,
        };
        let first_comment_id = this.state.replyBox_data.first_comment_id;
        this.ui.commentbox_controller.displayCommentBox(
            evt,
            $(
                ".commented-selection" +
                    "[commentId = '" +
                    first_comment_id +
                    "']"
            ).attr("typeof")
        );
        this.state.quill.setHTML(inText);
        if (hash != this.state.replyBox_data.first_comment_id) {
            console.log("not editting the first comment");
            $(".select2-save-comment-select").prop("disabled", true);
            $(".select2-selection").addClass("disabled_dropDown");
        } else {
            $(".select2-save-comment-select").prop("disabled", false);
            $(".select2-selection").removeClass("disabled_dropDown");
        }
    }

    async commentApprovedOrUnapprovedButtonOnClick(
        hash,
        commenterEppn,
        work,
        workCreator,
        approved
    ) {
        var data = {
            creator: workCreator,
            work: work,
            commenterEppn: commenterEppn,
            comment_hash: hash,
        };
        let endpoint;
        if (approved) {
            endpoint = "unapprove_comment";
        } else {
            endpoint = "approve_comment";
        }

        let response = await this.state.api_data.comments_data.change_comment_approval(
            data,
            endpoint
        );
        launchToastNotifcation(response);
        let firstCommentHash = this.state.replyBox_data.first_comment_id;
        let firstCommenter = this.state.replyBox_data.first_comment_author;
        let firstCommentData = {
            creator: workCreator,
            work: work,
            commenter: firstCommenter,
            hash: firstCommentHash,
        };
        //getUnapprovedComments(workCreator, work);
        response = await this.state.api_data.comments_data.get_unapprove_comments(
            {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
            }
        );
        response.forEach((data) => {
            let ancesHash = data["AncestorHash"];
            let hash = data["CommentHash"];
            //the first Level is unapproved
            if (ancesHash == hash) {
                $(
                    ".commented-selection" + "[commentId = '" + hash + "']"
                ).addClass("unapprovedComments");
            } else {
                $(
                    ".commented-selection" + "[commentId = '" + ancesHash + "']"
                ).addClass("threadNotApproved");
            }
        });
        this.refreshReplyBox(
            workCreator,
            work,
            firstCommenter,
            firstCommentHash
        );
    }

    async commentPrivateButtonOnClick(evt, work, workCreator, setPublic) {
        var commentId =
            evt["currentTarget"]["attributes"]["commentid"]["value"];
        var commenterEppn = $(
            ".replies" + "[commentId = '" + commentId + "']"
        ).attr("name");
        var data = {
            creator: workCreator,
            work: work,
            comment_hash: commentId,
            public: setPublic ? true : false,
        };

        let response = await this.state.api_data.comments_data.change_comment_privacy(
            data
        );
        if (setPublic) {
            launchToastNotifcation("successfully set comment to public");
        } else {
            launchToastNotifcation("successfully set comment to private");
        }
        let firstCommentId = this.state.replyBox_data.first_comment_id;
        let firstCommentCommenter = this.state.replyBox_data
            .first_comment_author;
        this.refreshReplyBox(
            workCreator,
            work,
            firstCommentCommenter,
            firstCommentId
        );
    }

    async deleteButtonOnClick(hash, eppn, work, workCreator) {
        this.state.replyBox_data["delete_comment_id"] = hash;
        let first_comment_id = this.state.replyBox_data.first_comment_id;
        let first_comment_author = this.state.replyBox_data
            .first_comment_author;

        var delete_data = {
            creator: workCreator,
            work: work,
            commenter: eppn,
            hash: hash,
        };
        await this.state.api_data.comments_data.delete_comment(delete_data);

        // delete first comment
        if (first_comment_id == this.state.replyBox_data.delete_comment_id) {
            await this.ui.comments_controller.recover_span(first_comment_id);
            //await this.ui.comments_controller.recover_span(first_comment_id);
            //checkSpansNeedRecover(first_comment_id, removeDeletedSpan);
            let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
            console.log("checkSpansNeedRecover", work_comment_data);
            //TODO Not sure why this is here, itf there is any filter problem check this
            //this.ui.base_events.filters_events.reset(work_comment_data);
            this.ui.base_events.filters_events.color_not_used_type_selector(
                work_comment_data,
                "@stonybrook.edu"
            );
            $("#replies").parent().fadeOut();
        } else {
            this.refreshReplyBox(
                workCreator,
                work,
                first_comment_author,
                first_comment_id
            );
        }
        allowClickOnComment(delete_data["work"], delete_data["creator"]);
        // let response = await this.state.api_data.comments_data.get_unapprove_comments({creator: this.state.selected_creator, work: this.state.selected_work});
        // console.log(response);
        // response.forEach((data) => {
        //     let ancesHash = data["AncestorHash"];
        //     let hash = data["CommentHash"];
        //     //the first Level is unapproved
        //     if (ancesHash == hash) {
        //         $(".commented-selection" + "[commentId = '" + hash + "']").addClass("unapprovedComments");
        //     } else {
        //         $(".commented-selection" + "[commentId = '" + ancesHash + "']").addClass("threadNotApproved");
        //     }
        // });
        //getUnapprovedComments(delete_data["creator"], delete_data["work"]);
        delete this.state.replyBox_data.delete_comment_id;
        //$("#replies").removeAttr("deletedid");
    }

    displayReplyBox(data) {
        console.log(data);
        var marginX = 10;
        var marginY = 50;
        var newPosition = adjustDialogPosition(
            data,
            500,
            177,
            marginX,
            marginY
        );
        var type = data["typeOf"];
        $("#replies").parent().css({
            top: newPosition["newTop"],
            left: newPosition["newLeft"],
        });
        // ui-id-2 is the id for the title of the reply box
        $("#ui-id-2").empty().html(data["commentType"]);
        this.state.replyBox_data = {
            first_comment_id: data["commentId"],
            first_comment_author: data["commentCreator"],
        };
        $("#replies").parent().show();
    }

    async refreshReplyBox(creator, work, commenter, hash, type) {
        console.log(creator, work, commenter, hash, type);
        $("#replies").empty();
        if (type != undefined || type != null) {
            $("#ui-id-2").html(type);
        }

        let comment_data = {
            creator: creator,
            work: work,
            commenter: commenter,
            hash: hash,
        };

        let resp = await this.state.api_data.comments_data.get_comment_chain(
            comment_data
        );
        readThreads(resp);
    }

    preload() {}

    postload() {}
}
