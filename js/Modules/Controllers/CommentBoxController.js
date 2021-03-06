export class CommentBoxController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/CommentBoxController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * Create the comment box jQuery dialog.   (PLEASE CHECK HOW EVERYTHING WORKS BEFORE SWITCHING, SO WE CAN SWITCH WITHOUT BREAKING TOO MANY THING)
     * TODO:
     */
    create_commentbox() {
        $("#comment-box").dialog({
            dialogClass: "no-close",
            modal: true,
            width: 500,
            use: 'comments',
            buttons: [
                {
                    text: "Save",
                    id: "commentSave",
                    click: async () => {
                        await this.save_comment();
                    },
                },
                {
                    text: "Exit",
                    id: "commentExit",
                    click: () => {
                        this.exit_comment_box();
                    },
                },
            ],
            title: "Annotation by: ",
        });

        // TODO: find a better way to add the close button to a jQuery Dialog
        $("#comment-box").parent().find(".ui-dialog-titlebar").prepend(
            $("<div>", {
                class: "closeCommentBoxDiv"
            }).append(
                $("<button/>", {
                    class: "closeCommentBox",
                    click: () => {
                        this.exit_comment_box();
                    }
                }).append(
                    $("<i/>", {
                        class: "material-icons closeCommentBoxIcon",
                        text: "highlight_off"
                    })
                )
            )
        );

        // TODO: move this out of here.
        $(".closeCommentBox").parent().css({ position: 'relative' });
        $(".closeCommentBox").css({ top: 0, left: 0, position: 'absolute' });
    }

    /**
     * Function that handles saving a comment
     * TODO:
     */
    async save_comment() {
        console.log(this.state.commentBox_data);
        let commentText = this.state.quill.getHTML();

        if (commentText == "<p><br></p>") {
            this.ui.toast.create_toast("You cannot save an empty comment!", "warning");
            return;
        }

        let commentType = $(".commentTypeDropdown").val();

        let span = $("." + escapeSpecialChar(this.state.rem_span));


        // if state.commentBox_data don't exist, the current comment to be saved is the starting comment of the thread
        let replyEppn = this.state.commentBox_data ? this.state.commentBox_data.eppn_to_reply_to : undefined;
        let replyHash = this.state.commentBox_data ? this.state.commentBox_data.hash_to_reply_to : undefined;
        let editCommentID = this.state.commentBox_data ? this.state.commentBox_data.edit_comment_id : undefined;

        /**
         * Determine if its a comment save or comment edit
         */
        if (editCommentID != undefined) {
            // edit/delete comment
            let commentCreatorEppn = $(".replies" + "[commentid = '" + editCommentID + "']").attr('name');

            // Check if this is a comment or reply (reply will not have a type)
            let type;
            if ($(".replies" + "[commentid = '" + editCommentID + "']").attr('type')) {
                type = $('.commentTypeDropdown').children("option:selected").val();
            } else {
                type = null;
            }

            let data_edit = {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
                commenter: commentCreatorEppn,
                hash: editCommentID,
                type: type,
                text: commentText,
                public: true,
            };

            //editOrDelete(data_edit, this.state.commentBox_data.edit_comment_id);

            let edit_comment_response = await this.state.api_data.comments_data.edit_comment(data_edit);
            this.ui.toast.create_toast(edit_comment_response);

            let firstCommentId = this.state.replyBox_data.first_comment_id;
            let firstCommentCreator = this.state.replyBox_data.first_comment_author;

            this.ui.replybox_controller.refreshReplyBox(data_edit["creator"], data_edit["work"], firstCommentCreator, firstCommentId, data_edit["type"]);

            if (data_edit["type"]) {
                $(".commented-selection" + "[commentId = '" + this.state.commentBox_data.edit_comment_id + "']").attr("typeof", data_edit["type"]);
                let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
                this.ui.base_events.filters_events.color_not_used_type_selector(work_comment_data, "@stonybrook.edu");
                console.log(this.state.filters.selected_comment_filter, data_edit["type"]);
                if (data_edit["type"] != this.state.filters.selected_comment_filter && this.state.filters.selected_comment_filter != "show-all-types") {
                    await this.ui.comments_controller.recover_span(this.state.commentBox_data.edit_comment_id);
                    //await this.ui.comments_controller.recover_span(this.state.commentBox_data.edit_comment_id);
                    //checkSpansNeedRecover(this.state.commentBox_data.edit_comment_id, removeDeletedSpan);
                    $("#replies").parent().fadeOut();
                }
            }
            $("#comment-box").parent().fadeOut();
        }
        // save new comment
        else {
            let data_save = {
                author: this.state.selected_creator,
                work: this.state.selected_work,
                commentText: commentText,
                commentType: commentType,
                startIndex: (span.attr("startIndex") ? span.attr("startIndex") : null),
                endIndex: (span.attr("endIndex") ? span.attr("endIndex") : null),
                replyTo: (replyEppn ? replyEppn : null),
                replyHash: (replyHash ? replyHash : null),
                visibility: true,
            };

            /**
             * Save the comment via API request
             */
            let save_comment_response = await this.state.api_data.comments_data.save_comment(data_save);

            // create a toast showing the response of saving the comment
            this.ui.toast.create_toast(save_comment_response.message);

            // hide the textarea comment box
            $("#comment-box").parent().fadeOut();

            /**
             * Refresh the reply box if it's a reply,
             * Otherwise, dynamically insert the new comment/highlight into the DOM and display it
             */
            if (replyEppn) {
                let firstCommentId = this.state.replyBox_data.first_comment_id;
                let firstCommentCreator = this.state.replyBox_data.first_comment_author;

                this.ui.replybox_controller.refreshReplyBox(data_save["author"], data_save["work"], firstCommentCreator, firstCommentId);
            } else {
                /**
                 * Since it's a new highlight, dynamically reset the filters for it.
                 */
                console.log(this.state.filters);
                let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
                //TOCHECK
                //this.ui.base_events.filters_events.reset(work_comment_data);
                //this.ui.render_literature();

                let approved;
                let index = {
                    'start': $('.' + escapeSpecialChar(this.state.rem_span)).attr("startIndex"),
                    'end': $('.' + escapeSpecialChar(this.state.rem_span)).attr("endIndex")
                }

                $('.' + escapeSpecialChar(this.state.rem_span)).removeAttr('startindex endIndex');

                if (save_comment_response["approval"] == true) {
                    approved = true;
                } else {
                    approved = false;
                    $('.' + escapeSpecialChar(this.state.rem_span)).addClass("unapprovedComments");
                }

                $('.' + escapeSpecialChar(this.state.rem_span)).attr({
                    'commentId': save_comment_response['commentHash'],
                    'creator': this.state.current_user.eppn,
                    'typeof': data_save['commentType'],
                    'approved': approved
                });

                $("<param/>", {
                    class: 'startDiv',
                    commentId: save_comment_response['commentHash'],
                    startIndex: index["start"],
                    colorId: 0
                }).insertBefore('.' + escapeSpecialChar(this.state.rem_span));

                $("<param/>", {
                    class: 'endDiv',
                    commentId: save_comment_response['commentHash'],
                    endIndex: index["end"],
                    colorId: 0
                }).insertAfter('.' + escapeSpecialChar(this.state.rem_span));

                $('.' + escapeSpecialChar(this.state.rem_span)).removeClass(this.state.rem_span);

                let allComments = createCommentData();
                this.ui.comments_controller.handleStartEndDiv(allComments);

                this.ui.base_events.filters_events.color_not_used_type_selector(work_comment_data, "@stonybrook.edu");

                //updateCommenterSelectors();

                //update the click event on this new added comment
                allowClickOnComment(data_save["work"], data_save["author"]);
            }

            // TODO: what's this do.
            // NOTE: This function colors the comment if this comment is a unapporved comment

            //getUnapprovedComments(data_save["author"], data_save["work"]);
            let response = await this.state.api_data.comments_data.get_unapprove_comments({creator: this.state.selected_creator, work: this.state.selected_work});
            console.log(response);
            response.forEach((data) => {
                let ancesHash = data["AncestorHash"];
                let hash = data["CommentHash"];
                //the first Level is unapproved
                if (ancesHash == hash) {
                    $(".commented-selection" + "[commentId = '" + hash + "']").addClass("unapprovedComments");
                } else {
                    $(".commented-selection" + "[commentId = '" + ancesHash + "']").addClass("threadNotApproved");
                }
            });
        }
    }

    displayCommentBox(evt, selected_filter) {
        console.log(selected_filter);
        var marginX = 10;
        var marginY = 50;
        var newPosition = adjustDialogPosition(evt, 500, 331, 10, 50);

        $("#comment-box").parent().css({
            'top': newPosition["newTop"],
            'left': newPosition["newLeft"],
            'z-index': 5
        })

        $("#comment-box").parent().find("#ui-id-1").contents().filter(function () { return this.nodeType == 3; }).first().replaceWith("Annotation by: " + TMP_STATE.current_user['firstname'] + " " + TMP_STATE.current_user['lastname']);
        $("#comment-box").parent().fadeIn();

        if (selected_filter != "show-all-types" && selected_filter !== undefined) {
            let val_selected = selected_filter.charAt(0).toUpperCase() + selected_filter.slice(1);

            $(".select2-save-comment-select").val(val_selected).trigger("change");
            $(".select2-save-comment-select").prop("disabled", true);
        }
    }

    exit_comment_box() {
        //ADDED to clean the data when user exit comment box
        delete this.state.commentBox_data;
        delete TMP_STATE.commentBox_data;

        this.state.quill.setText("");

        $("#commentExit").text("Exit");

        this.ui.rangy_controller.unhighlight();
        $("#comment-box").parent().css('z-index', 0);
        $("#comment-box").parent().fadeOut();
    }
}
