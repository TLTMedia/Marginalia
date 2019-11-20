export class CommentBoxController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/CommentBoxController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * Create the comment box jQuery dialog.   (PLEASE CHECK HOW EVERYTHING WORKS BEFORE SWITCHING, SO WE CAN SWITCH WITHOUT BREAKING TOO MANY THING)
     * (I found a lot of minor bugs and it's really hard to find where is the problem bcuz we changed the structure)
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
        console.log(TMP_STATE.commentBox_data);
        let commentText = this.state.quill.getHTML();

        if (commentText == "<p><br></p>") {
            this.ui.toast.create_toast("You cannot save an empty comment!", "warning");

            return;
        }

        let commentType = $(".commentTypeDropdown").val();

        let span = $("." + escapeSpecialChar(this.state.rem_span));

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
            let commentType;
            if ($(".replies" + "[commentid = '" + editCommentID + "']").attr('type')) {
                commentType = $('.commentTypeDropdown').children("option:selected").val();
            } else {
                commentType = null;
            }

            let data_edit = {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
                commenter: commentCreatorEppn,
                hash: editCommentID,
                type: commentType,
                text: commentText,
                public: true,
            };

            //editOrDelete(data_edit, this.state.commentBox_data.edit_comment_id);

            let edit_comment_response = await this.state.api_data.comments_data.edit_comment(data_edit);
            this.ui.toast.create_toast(edit_comment_response);

            let firstCommentId = this.state.replyBox_data.first_comment_id;
            let firstCommentCreator = this.state.replyBox_data.first_comment_author;

            refreshReplyBox(data_edit["creator"], data_edit["work"], firstCommentCreator, firstCommentId, data_edit["type"]);

            if (data_edit["type"]) {
                $(".commented-selection" + "[commentId = '" + this.state.commentBox_data.edit_comment_id + "']").attr("typeof", data_edit["type"]);
                let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
                colorNotUsedTypeSelector(work_comment_data);
                console.log(this.state.filters.selected_comment_filter, data_edit["type"]);
                if(data_edit["type"] != this.state.filters.selected_comment_filter && this.state.filters.selected_comment_filter != "show-all-types"){
                    checkSpansNeedRecover(this.state.commentBox_data.edit_comment_id, removeDeletedSpan);
                    hideReplyBox();
                }
            }
            $("#comment-box").attr('data-editCommentID', '-1');
            $("#comment-box").parent().fadeOut();
        } else {
            // save new comment
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

                refreshReplyBox(data_save["author"], data_save["work"], firstCommentCreator, firstCommentId);
            } else {
                /**
                 * Since it's a new highlight, dynamically reset the filters for it.
                 */
                let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
                this.ui.base_events.filters_events.reset(work_comment_data);

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
                handleStartEndDiv(allComments);
                colorNotUsedTypeSelector(work_comment_data);
                //updateCommenterSelectors();

                //update the click event on this new added comment
                allowClickOnComment(data_save["work"], data_save["author"]);
            }

            // TODO: what's this do.
            // NOTE: This function colors the comment if this comment is a unapporved comment
            getUnapprovedComments(data_save["author"], data_save["work"]);
        }
    }

    exit_comment_box() {
        //ADDED to clean the data when user exit comment box
        delete this.state.commentBox_data;
        delete TMP_STATE.commentBox_data;

        this.state.quill.setText("");

        $("#commentExit").text("Exit");

        this.ui.rangy_controller.unhighlight();
        $("#comment-box").parent().css('z-index',0);
        $("#comment-box").parent().fadeOut();
    }
}
