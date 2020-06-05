export class MainMenuEvents {
    constructor({ state = state, base_events = base_events, ui = ui }) {
        console.log("BaseEventBinds/MainMenuEvents Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.base_events = base_events;
    }

    /**
     * Preload
     */
    preload() {
        /**
         * Home button
         */
        $("#home").off().on("click", () => {
            $.modal.close();

            // Hide the submenu
            this.ui.hide_sub_menu();

            // Hide the work page
            this.ui.hide_work_page();

            // Show the home page
            this.ui.show_home_page();
        });

        /**
         * Add-literature button
         */
        $("#litadd").off().on("click", async () => {
            /**
             * Show the add-lit modal
             */
            $("#add-lit-modal").modal({
                closeClass: 'icon-remove',
                closeText: '!',
            });

            /**
             * Bind the events that come with the upload/add-lit page
             */
            this.base_events.upload_events.preload();
        });

        /**
         * Show tutorial button
         */
        $("#tutorial").off().on("click", () => {
            this.ui.tutorial_controller.show_tutorial_page();
        })
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {

    }
}