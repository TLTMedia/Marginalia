export class FiltersEvents {
    constructor({ state = state, ui = ui, base_events = base_events }) {
        console.log("BaseEventBinds/FiltersEvents Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.base_events = base_events;
    }

    /**
     * Parse out the unique commenter eppns and the comment types from the raw work_comment_data
     */
    parse_filter_data(comment_data) {
        let all_types = Array();
        let all_eppns = Array();
        let all_names = Array();

        comment_data.forEach((comment) => {
            all_types.push(comment.commentType);
            all_eppns.push(comment.eppn);
            all_names.push(comment.firstName + " " + comment.lastName);
        });

        let unique_types = Array();
        let unique_eppns = Array();
        let complete_names = Array();
        let unique_names_eppns = Array();

        /**
         * Add the Show All filter
         */
        unique_types.push("show-all-types");

        /**
         * eppns and names are together, except that names is the visible label, and eppns is the non-visible unique identifier
         */
        unique_eppns.push("show-all-eppns");
        complete_names.push("Show All");

        all_types.forEach(comment_type => {
            if (!unique_types.includes(comment_type)) {
                unique_types.push(comment_type);
            }
        });

        all_eppns.forEach(commenter_eppn => {
            if (!unique_eppns.includes(commenter_eppn)) {
                unique_eppns.push(commenter_eppn);
            }
        });

        /**
         * So this is a bit more computationally expensive than the above, since:
         * You can have 2 people with the same first and last name.
         * We want to add the name twice to the array. But not add it twice for the same person.
         * So we check via the eppn if it's the same person...
         */
        for (let i = 0; i < all_names.length; ++i) {
            if (!unique_names_eppns.includes(all_eppns[i])) {
                unique_names_eppns.push(all_eppns[i]);
                complete_names.push(all_names[i]);
            }
        }

        return {
            types: unique_types,
            eppns: unique_eppns,
            names: complete_names,
        };
    }

    /**
     * Reset necessarily things,
     * This is called everytime a new work is loaded
     */
    reset(comment_data) {
        console.log(comment_data)
        this.state.filters = {};
        this.state.filters.selected_comment_filter = "show-all-types";
        this.state.filters.selected_author_filter = "show-all-eppns";

        /**
         * Remove all the eppn filters
         */
        $("#menu-filters-authors").empty();

        /**
         * Remove the selected highlighting from any of the other items that may already be highlighted
         */
        $(".selected-filter").removeClass("selected-filter");
        $("#filter-show-all-types").addClass("selected-filter");

        let work_filter_data = this.parse_filter_data(comment_data);

        /**
         * Disable all types - then only enable types from the filter
         */
        $(".menu-filters-types").each((_, item) => {
            $(item).attr({
                disabled: true,
            });
        });

        /**
         * Remove disabled attribute for menu filter types that exist in this work
         */
        work_filter_data.types.forEach(type => {
            if (type == null) {
                type = "historical";
            }

            $("#filter-" + type.toLowerCase()).removeAttr("disabled");
        });

        /**
         * Create filters for eppns that exist.
         * TODO: text is their eppn, we should get their firstname-lastname instead of showing by eppn
         */
        for (let i = 0; i < work_filter_data.eppns.length; ++i) {
            let author_name = work_filter_data.names[i];
            let eppn = work_filter_data.eppns[i];

            /**
             * Remove everything after (including) the '@' character in the eppn
             */
            if (eppn.indexOf("@") != -1) {
                eppn = eppn.substring(0, eppn.indexOf("@"));
            }

            let is_selected = "";

            if (eppn == "show-all-eppns") {
                is_selected = "selected-filter";
            }

            $("#menu-filters-authors").append(
                $("<li/>", {
                    class: "menu-filters-authors mdl-menu__item " + is_selected,
                    id: "filter-" + eppn,
                    text: author_name,
                })
            );

            /**
             * Clicking on dynamically added material menu item to close it...
             */
            document.getElementById("filter-" + eppn).addEventListener('click', document.getElementById("menu-filters-authors").MaterialMenu.handleForClick_.bind(document.getElementById("menu-filters-authors").MaterialMenu));
        }

        //this.ui.comments_controller.filter_render_comments();
        this.update_filter_status();
        componentHandler.upgradeAllRegistered();
    }

    // NOTE: added by David
    update_filter_status() {
        let current_type = this.state.filters.selected_comment_filter;
        let current_commenter = this.state.filters.selected_author_filter;
        let regex = /show-all/g;

        if (current_type.match(regex) != null) {
            $("#type_filter_status").html("Selected type: ALL");
        } else {
            $("#type_filter_status").html("Selected type: " + current_type[0].toUpperCase() + current_type.slice(1));
        }

        if (current_commenter.match(regex) != null) {
            $("#commenter_filter_status").html("Selected commenter: ALL");
        } else {
            $("#commenter_filter_status").html("Selected commenter: " + current_commenter[0].toUpperCase() + current_commenter.slice(1));
        }
    }

    /**
     * NOTE: added by David
     * work_comment_data : comment data for the current work
     * eppn_format : eppn for stony brook student will be "@stonybrook.edu"
     *
     * Disables filter buttons in the menu if they have no comments of the particular type.
     */
    color_not_used_type_selector(work_comment_data, eppn_format) {
        console.log(work_comment_data);
        // TODO: HARD CODED FOR STONYBROOK STUDENT
        let commenter = this.state.filters.selected_author_filter;
        let key = ["Historical", "Analytical", "Comment", "Definition", "Question"];
        let buttonTypes = {
            "Historical": 0,
            "Analytical": 0,
            "Comment": 0,
            "Definition": 0,
            "Question": 0,
        };

        for (let i = 0; i < work_comment_data.length; i++) {
            let type = work_comment_data[i]["commentType"];

            if (commenter != "show-all-eppns") {
                let data_commenter = work_comment_data[i]["eppn"];
                if (commenter + eppn_format == data_commenter) {
                    buttonTypes[type] += 1;
                }
            } else {
                buttonTypes[type] += 1;
            }

        }

        key.forEach(element => {
            $("#filter-" + element.toLowerCase()).removeAttr("disabled");

            if (buttonTypes[element] == 0) {
                $("#filter-" + element.toLowerCase()).attr("disabled", "disabled");
            }
        });
    }

    /**
     * NOTE: can pick user and comment type combination to filter.
     */

    /**
     * Preload - only happens once on the page / object load
     */
    preload() {
        /**
         * Clicking on the types-filters button in the sub-menu
         */
        $(".menu-filters-types").on("click", async event => {
            let selected_filter = event.currentTarget.id;
            /**
             * If it has the class of "selected-filter", don't let the user press on it
             * aka don't do anything when the user presses on it
             */
            if ($(event.target).hasClass("selected-filter")) {
                /**
                 * TODO: add a way to keep the menu open even after clicking on an item...
                 * https://github.com/google/material-design-lite/issues/5257
                 */

                return;
            }

            /**
             * Set the currently selected filter (id) in the state
             */
            this.state.filters.selected_comment_filter = (selected_filter.replace("filter-", ""));

            /**
             * Remove the selected highlighting from any of the other items that may already be highlighted
             */
            $(".menu-filters-types").removeClass("selected-filter");

            /**
             * Add the highlighting to the one the user just pressed on
             */
            $("#" + selected_filter).addClass("selected-filter");

            await this.ui.comments_controller.filter_render_comments();

            //CHANGED when there is no comments, this it returns error : cannot read "top" of type undefined
            if ($(".commented-selection").length != 0) {
                if ($(".commented-selection").offset().top > $(window).height()) {
                    $(".commented-selection")[0].scrollIntoView();
                }
            }
            this.update_filter_status();
        });

        /**
         * Clicking on the authors filters button in the sub-menu
         */
        $("#menu-filters-authors").on("click", ".menu-filters-authors", async event => {
            let selected_filter = event.currentTarget.id;

            /**
             * If it has the class of "selected-filter", don't let the user press on it
             * aka don't do anything when the user presses on it
             */
            if ($(event.target).hasClass("selected-filter")) {
                /**
                 * TODO: add a way to keep the menu open even after clicking on an item...
                 * https://github.com/google/material-design-lite/issues/5257
                 */

                return;
            }

            /**
             * Set the currently selected filter (id) in the state
             */
            this.state.filters.selected_author_filter = (selected_filter.replace("filter-", ""));

            /**
             * Remove the selected highlighting from any of the other items that may already be highlighted
             */
            $(".menu-filters-authors").removeClass("selected-filter");

            /**
             * Add the highlighting to the one the user just pressed on
             */
            $("#" + selected_filter).addClass("selected-filter");

            await this.ui.comments_controller.filter_render_comments();

            //CHANGED same as the type filter problem
            if ($(".commented_selection").length != 0) {
                if ($(".commented-selection").offset().top > $(window).height()) {
                    $(".commented-selection")[0].scrollIntoView();
                }
            }

            let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();
            //TODO: Hard coded for @stonybrook.edu
            this.color_not_used_type_selector(work_comment_data, "@stonybrook.edu");
            this.update_filter_status();
        });

    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {
        // componentHandler.upgradeAllRegistered();
    }
}
