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
        console.log(reverse_sorted_comments)

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

        this.handleStartEndDiv(comment_data);

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
        let response = await this.state.api_data.comments_data.get_unapprove_comments({ creator: this.state.selected_creator, work: this.state.selected_work });
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
        this.unwrap_comments();

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
        console.log(selectedRange.nativeRange, lightRange)
        selectedRange.nativeRange = lightRange;

        $("#comment-box").removeAttr("data-replyToEppn data-replyToHash");

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

    //remove all spans if parameter is undefined ,else remove the given id comment
    unwrap_comments(id = undefined) {
        if (id != undefined) {
            $(".commented-selection" + "[commentId = '" + id + "']").contents().unwrap();
            $(".startDiv" + "[commentId = '" + id + "']").remove();
            $(".endDiv" + "[commentId = '" + id + "']").remove();
        }
        else {
            $(".commented-selection").contents().unwrap();
            $(".startDiv").remove();
            $(".endDiv").remove();
        }

    }

    handleStartEndDiv(commentData) {
        //TODO
        this.handleIncorrectTemplate();
        let sortedCommentData = [];
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
        this.ui.comments_controller.set_comments_color(sortedCommentData);
    }

    //Works when new thread is created
    handleIncorrectTemplate() {
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

    async recover_span(id) {
        let allComments = createCommentData();
        console.log(allComments);
        let startIndex = parseInt($(".startDiv" + "[commentId = " + id + "]").attr("startIndex"));
        let endIndex = parseInt($(".endDiv" + "[commentId = " + id + "]").attr("endIndex"));
        // comments that are partially covered id
        let after_start_index = [];
        let before_end_index = [];
        // comments that totally covered id
        let totally_covered = [];
        for (let i in allComments) {
            let currStart = parseInt($(".startDiv" + "[commentId = " + allComments[i].hash + "]").attr("startIndex"));
            let currEnd = parseInt($(".endDiv" + "[commentId = " + allComments[i].hash + "]").attr("endIndex"));
            if (currStart >= startIndex && currStart <= endIndex && allComments[i].hash != id) {
                after_start_index.push({ hash: allComments[i].hash, startIndex: currStart, endIndex: currEnd });
            }
            if (currEnd <= endIndex && currEnd >= startIndex && allComments[i].hash != id) {
                before_end_index.push({ hash: allComments[i].hash, startIndex: currStart, endIndex: currEnd });
            }
            if (currEnd >= endIndex && currStart <= startIndex && allComments[i].hash != id) {
                totally_covered.push({ hash: allComments[i].hash, startIndex: currStart, endIndex: currEnd });
            }
        }
        console.log("start: ", startIndex, "end: ", endIndex);
        console.log(after_start_index, before_end_index, totally_covered);
        let raw = []
        for (let i in after_start_index) {
            raw.push(after_start_index[i]);
        }
        for (let i in before_end_index) {
            raw.push(before_end_index[i]);
        }
        for (let i in totally_covered) {
            raw.push(totally_covered[i]);
        }
        let clean = [];
        for (let i in raw) {
            let curr = raw[i];
            let exist = false;
            for (let j in clean) {
                if (parseInt(clean[j].hash) == parseInt(curr.hash)) {
                    exist = true;
                }
            }
            if (!exist) {
                clean = sortCommentsByStartIndex(clean, curr);
            }
        }
        console.log(clean);
        clean = reverseList(clean);
        this.unwrap_comments(id)
        for (let i in clean) {
            let recoverData = {
                startIndex: clean[i].startIndex,
                endIndex: clean[i].endIndex,
                commentType: $(".commented-selection" + "[ commentId = " + clean[i].hash + "]").attr("typeof"),
                eppn: $(".commented-selection" + "[ commentId = " + clean[i].hash + "]").attr("creator"),
                hash: clean[i].hash,
                approved: $(".commented-selection" + "[ commentId = " + clean[i].hash + "]").attr("approved")
            }
            if (!clean[i].hash) {
                this.unwrap_comments(clean[i].hash);
            }
            highlightText(recoverData);
        }
        this.handleStartEndDiv(createCommentData());
    }

    //TODO this function still needs improvment , if the start and end index is large than the margin might be too big
    // async recover_span(id){
    //     // get the list of comments that need to get recovered
    //     let startIndex = $(".startDiv" + "[commentId ='" + id + "']").attr("startIndex");
    //     let endIndex = $(".endDiv" + "[commentId ='" + id + "']").attr("endIndex");
    //     let raw = [];
    //     let margin = parseInt((endIndex - startIndex)/4);
    //     for (let i = parseInt(startIndex); i < endIndex; i = i + margin){
    //         this.state.recoverData = await this.state.api_data.comments_data.get_comments_by_index({
    //             "work": this.state.selected_work,
    //             "creator": this.state.selected_creator,
    //             "index": i
    //         });
    //         for (let j in this.state.recoverData){
    //             raw.push(this.state.recoverData[j]);
    //         }
    //     }
    //     // this.state.recoverDataStart = await this.state.api_data.comments_data.get_comments_by_index({
    //     //     "work": this.state.selected_work,
    //     //     "creator": this.state.selected_creator,
    //     //     "index": startIndex
    //     // });
    //     // this.state.recoverDataEnd = await this.state.api_data.comments_data.get_comments_by_index({
    //     //     "work": this.state.selected_work,
    //     //     "creator": this.state.selected_creator,
    //     //     "index": endIndex
    //     // });
    //     // //merge both recover list
    //     // let recover_comments_start = this.state.recoverDataStart;
    //     // let recover_comments_end = this.state.recoverDataEnd;
    //
    //     // for (let i = 0; i < recover_comments_start.length; i ++){
    //     //     raw.push(recover_comments_start[i]);
    //     // }
    //     // for (let i = 0; i < recover_comments_end.length; i ++){
    //     //     raw.push(recover_comments_end[i]);
    //     // }
    //     //remove the duplicate data and sort it as startIndex (big->small)
    //     let clean = [];
    //     for (let i in raw){
    //         let curr = raw[i];
    //         let exist = false;
    //         for(let j in clean){
    //             if(parseInt(clean[j].hash) == parseInt(curr.hash)){
    //                 exist = true;
    //             }
    //         }
    //         if(!exist){
    //             clean = sortCommentsByStartIndex(clean,curr);
    //         }
    //     }
    //     clean = reverseList(clean);
    //     console.log(clean);
    //     console.log(id);
    //     this.unwrap_comments(id)
    //     for (let i in clean){
    //         console.log(clean[i])
    //         if(!clean[i].hash){
    //             this.unwrap_comments(clean[i].hash);
    //         }
    //     }
    //     for (let i in clean){
    //         let recoverData = {
    //             startIndex: clean[i].startIndex,
    //             endIndex: clean[i].endIndex,
    //             commentType: clean[i].commentType,
    //             eppn: clean[i].eppn,
    //             hash: clean[i].hash,
    //             approved: clean[i].approved
    //         }
    //         highlightText(recoverData);
    //     }
    //     this.handleStartEndDiv(createCommentData());
    // }

    set_comments_color(sortedCommentData) {
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
            $(".commented-selection" + "[commentId = '" + id + "']").removeClass().addClass("commented-selection").addClass(commentsColorClass[goal_color_id]);
            $(".startDiv" + "[commentId ='" + id + "']").attr({ "parentHash": parentId, "colorId": goal_color_id });
            $(".endDiv" + "[commentId ='" + id + "']").attr({ "parentHash": parentId, "colorId": goal_color_id });
        }
    }

    // async new_span_recover(id) {
    //     // get the list of comments that need to get recovered
    //     let startIndex = $(".startDiv" + "[commentId ='" + id + "']").attr("startIndex");
    //     let endIndex = $(".endDiv" + "[commentId ='" + id + "']").attr("endIndex");
    //     // this.state.recoverDataStart;
    //     // this.state.recoverDataEnd;
    //     await API.request({
    //         endpoint: "comments_within_index",
    //         method: "GET",
    //         data: {
    //             "work": this.state.selected_work,
    //             "creator": this.state.selected_creator,
    //             "index": startIndex
    //         }
    //     }).then((data) => {
    //         this.state.recoverDataStart = data;
    //     });
    //     await API.request({
    //         endpoint: "comments_within_index",
    //         method: "GET",
    //         data: {
    //             "work": this.state.selected_work,
    //             "creator": this.state.selected_creator,
    //             "index": endIndex
    //         }
    //     }).then((data) => {
    //         this.state.recoverDataEnd = data;
    //     });
    //     //merge both recover list
    //     let recover_comments_start = this.state.recoverDataStart;
    //     let recover_comments_end = this.state.recoverDataEnd;
    //     let raw = [];
    //     for (let i = 0; i < recover_comments_start.length; i++) {
    //         raw.push(recover_comments_start[i]);
    //     }
    //     for (let i = 0; i < recover_comments_end.length; i++) {
    //         raw.push(recover_comments_end[i]);
    //     }
    //     //remove the duplicate data
    //     let clean = [];
    //     for (let i in raw) {
    //         let curr = raw[i];
    //         let exist = false;
    //         for (let j in clean) {
    //             if (parseInt(clean[j].hash) == parseInt(curr.hash)) {
    //                 exist = true;
    //             }
    //         }
    //         if (!exist) {
    //             clean.push(curr);
    //         }
    //     }
    //     let goal = [];
    //     for (let i in clean) {
    //         let curr = clean[i];
    //         let currIndex = 0;
    //         goal.unshift(curr);
    //         for (let j in goal) {
    //             if (goal[j].startIndex > curr.startIndex) {
    //                 let temp = goal[j];
    //                 goal[j] = goal[currIndex];
    //                 goal[currIndex] = temp;
    //                 currIndex = j;
    //             }
    //         }
    //     }
    //     console.log(goal);
    //     removeDeletedSpan(id)
    //     for (let i in goal) {
    //         removeDeletedSpan(goal[i].hash);
    //     }
    //     for (let i in goal) {
    //         let recoverData = {
    //             startIndex: goal[i].startIndex,
    //             endIndex: goal[i].endIndex,
    //             commentType: goal[i].commentType,
    //             eppn: goal[i].eppn,
    //             hash: goal[i].hash,
    //             approved: goal[i].approved
    //         }
    //         highlightText(recoverData);
    //     }
    //     handleStartEndDiv(createCommentData());
    // }
}
