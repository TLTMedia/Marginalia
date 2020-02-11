export class CommentsController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/CommentsController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * TODO: was loadUserComments()
     * Load the user comments into the DOM
     */
    async load_user_comments() {
        /**
         * Get all the highlights, or filtered ones
         */
        let comment_data;
        if (this.state.filters !== undefined) {
            if (this.state.filters.selected_comment_filter == "show-all-types" && this.state.filters.selected_author_filter == "show-all-eppns") {
                comment_data = await this.state.api_data.comments_data.get_work_highlights();

                $("#text-wrapper").hide();
            } else {
                comment_data = await this.state.api_data.comments_data.get_work_highlights_filtered();
            }
        } else {
            comment_data = await this.state.api_data.comments_data.get_work_highlights();
        }

        /**
         * Sort the comments of start index
         */
        let sorted_comments = [];
        for (let i = 0; i < comment_data.length; i++) {
            let comment = comment_data[i];
            // TODO:
            sorted_comments = sortCommentsByStartIndex(sorted_comments, comment);
        }

        // reverse the list so the comments are created by the order of the startIndex. (bigger startIndex get created first)
        // TODO:
        let reverse_sorted_comments = reverseList(sorted_comments);

        this.render_comments(reverse_sorted_comments);

        return comment_data;
    }

    /**
     * TODO: was renderComments()
     * Render the page comments on a page load,
     */
    async render_comments(comment_data) {
        $("#text-wrapper").fadeIn();

        for (let i = 0; i < comment_data.length; i++) {
            highlightText({
                startIndex: comment_data[i].startIndex,
                endIndex: comment_data[i].endIndex,
                commentType: comment_data[i].commentType,
                eppn: comment_data[i].eppn,
                hash: comment_data[i].hash,
                approved: comment_data[i].approved,
            });
        }

        handleStartEndDiv(comment_data);

        $("#litDiv").off().on("mousedown", event => {
            this.state.selection = {
                start: true,
                start_class: event.target.classList[0],
                start_pos_x: event.originalEvent.pageX,
                start_pos_y: event.originalEvent.pageY,
            };
        });

        $("#litDiv").on("mouseup", event => {
            if (this.state.selection !== undefined) {
                /**
                 * Only events that have this property true are processed.
                 * Events that begin with a mousedown event in #litDiv are processed
                 */
                if (this.state.selection.start) {
                    this.state.selection.start = false;

                    /**
                     * Only events that are greate than +- 2px (should test this num) are processed.
                     * That is; +/- 2px from the original mousedown event.
                     *
                     * Why? So that a simple "click" on a comment isn't processed here.
                     */
                    if (Math.abs(this.state.selection.start_pos_x - event.originalEvent.pageX) >= 2 || Math.abs(this.state.selection.start_pos_y - event.originalEvent.pageY) >= 2) {
                        if (event.target.classList[0] == "commented-selection") {
                            this.ui.toast.create_toast("You cannot create a comment that ends within another comment.");
                        } else {
                            delete this.state.commentBox_data;
                            delete TMP_STATE.commentBox_data;
                            $(".select2-selection").removeClass("disabled_dropDown");
                            this.highlight_selected_area(event);
                        }
                    }
                }
            }
        });
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
        //getUnapprovedComments(this.state.selected_creator, this.state.selected_work);
        allowClickOnComment(this.state.selected_work, this.state.selected_creator);
    }

    /**
     * TODO: was selectorOnSelect(currentSelectedType, currentSelectedCommenter, workData[author, work])
     * This function is called when changing filters.
     * It's responsible for re-rendering the comments on a page.
     */
    async filter_render_comments() {
        this.unwrap_all_comments();

        /**
         * Load the user comments
         */
        await this.load_user_comments();

        // TODO:
        //handleStartEndDiv(createCommentData());
        //allowClickOnComment(this.state.selected_work, this.state.selected_creator);
    }

    /**
     * TODO: was highlightCurrentSelection()
     * Applies Rangy library highlighting to a specified area.
     *
     * TODO: use lightRange library for getting the selection (at least on mobile)
     */
    highlight_selected_area(event) {
        let selectedRange = rangy.getSelection().getRangeAt(0);
        let lightRange = lightrange.saveSelection();
        console.log(selectedRange.nativeRange,lightRange)
        selectedRange.nativeRange = lightRange;

        $("#comment-box").removeAttr("data-replyToEppn data-replyToHash");
        $("#comment-box").attr("data-editcommentid", "-1");

        if (selectedRange.endOffset != selectedRange.startOffset) {
            this.ui.rangy_controller.unhighlight();

            // set the quill editor to empty and enabled
            this.state.quill.setText("");
            this.state.quill.enable();

            // change the close button to unselect
            $("#commentExit").text("Unselect");

            // enable the dropdown type for any type
            $(".commentTypeDropdown").removeAttr("disabled");

            // get the range via rangy
            let range = selectedRange.toCharacterRange(document.getElementById("textSpace"));

            // TODO: some how make this synchronous?
            this.ui.rangy_controller.highlight(selectedRange, range);

            if ($("." + escapeSpecialChar(this.state.rem_span)).parent().attr("class") != "commented-selection") {
                $("#replies").parent().hide();

                this.ui.commentbox_controller.displayCommentBox(event, this.state.filters.selected_comment_filter);
                //displayCommentBox(event, this.state.filters.selected_comment_filter);

            }
        }
    }

    unwrap_all_comments() {
        $(".commented-selection").contents().unwrap();
        $(".startDiv").remove();
        $(".endDiv").remove();
    }
}
