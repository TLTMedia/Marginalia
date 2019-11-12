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

        comment_data.forEach(comment => {
            all_types.push(comment.commentType);
            all_eppns.push(comment.eppn);
        });

        let unique_types = Array();
        let unique_eppns = Array();

        /**
         * Add the Show All filter
         */
        unique_types.push("show-all-types");
        unique_eppns.push("show-all-eppns");

        all_types.forEach(comment_type => {
            if (!unique_types.includes(comment_type)) {
                unique_types.push(comment_type);
            }
        });

        all_eppns.forEach(comment_author => {
            if (!unique_eppns.includes(comment_author)) {
                unique_eppns.push(comment_author);
            }
        });

        return {
            types: unique_types,
            eppns: unique_eppns,
        };
    }

    /**
     * Reset necessarily things,
     * This is called everytime a new work is loaded
     */
    reset(comment_data) {
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
        work_filter_data.eppns.forEach(eppn => {
            /**
             * Remove everything after (including) the '@' character in the eppn
             */
            if (eppn.indexOf("@") != -1) {
                eppn = eppn.substring(0, eppn.indexOf("@"));
            }

            let text = eppn;
            let is_selected = "";

            if (eppn == "show-all-eppns") {
                text = "Show All";
                is_selected = "selected-filter";
            }

            $("#menu-filters-authors").append(
                $("<li/>", {
                    class: "menu-filters-authors mdl-menu__item " + is_selected,
                    id: "filter-" + eppn,
                    text: text,
                })
            );

            /**
             * Clicking on dynamically added material menu item to close it...
             */
            document.getElementById("filter-" + eppn).addEventListener('click', document.getElementById("menu-filters-authors").MaterialMenu.handleForClick_.bind(document.getElementById("menu-filters-authors").MaterialMenu));
        });

        componentHandler.upgradeAllRegistered();
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

            if ($(".commented-selection").offset().top > $(window).height()) {
                $(".commented-selection")[0].scrollIntoView();
            }
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

            if ($(".commented-selection").offset().top > $(window).height()) {
                $(".commented-selection")[0].scrollIntoView();
            }
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
