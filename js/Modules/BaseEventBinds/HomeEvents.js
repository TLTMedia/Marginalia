export class HomeEvents {
    constructor({ state = state, base_events = base_events, ui = ui, courses_data = courses_data }) {
        console.log("BaseEventBinds/HomeEvents Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.base_events = base_events;
        this.courses_data = courses_data;
    }

    /**
     * Preload
     */
    async preload() {
        /** 
         * Populate the courses select dropdown 
         */
        let courses_list = await this.courses_data.get_course_list();
        if (!this.ui.populate_courses_dropdown(courses_list)) {
            console.error("error while attempting to populate courses dropdown");
        }

        /**
         * NOTE: populate users and works dropdown aren't here on purpose.
         * They aren't loaded the instant the page is loaded... Those 2 dropdowns are
         * generated based on events (clicking on the dropdown choice.)
         */

        /**
         * Add the listeners for searching
         */
        this.postload();
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {
        /**
         * Show the menu
         */
        $("#cardbox").show();

        /**
         * Sets the default/currently selected dropdown choice to nothing...
         * Must do this - otherwise can't select the first item (bug with Select2)
         */
        $(".select2-course-select").val("").trigger("change");

        /**
         * Clicking on a course
         */
        $(".select2-course-select").on("select2:select", e => {
            /**
             * Click course option maybe move to here in the future?
             */
            this.ui.ui_events.click_course_option(e.currentTarget.value);
        });

        /**
         * Clicking on a user
         */
        $(".select2-user-select").on("select2:select", e => {
            /**
             * Click course option maybe move to here in the future?
             */
            this.ui.ui_events.click_user_option(e.currentTarget.value);
        });

        /**
         * Clicking on a document/work
         */
        $(".select2-work-select").on("select2:select", e => {
            /**
             * Click course option maybe move to here in the future?
             */
            this.ui.ui_events.click_work_option(e.currentTarget.value);
        });
    }
}
