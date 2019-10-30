export class BaseEventBinds {
    constructor({ state = state, ui = ui, courses_data = courses_data, works_data = works_data }) {
        console.log("BaseEventBinds Module Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
        this.works_data = works_data;
    }

    /**
     * Bind events for the home page
     */
    async home_init() {
        /**
         * Home button in the main-menu
         */
        $("#home").off().on("click", () => {
            this.ui.hide_sub_menu();
            this.ui.show_home_page();
        });

        /**
         * Settings button in the sub-menu
         */
        $("#setting").off().on("click", () => {
            /**
             * TODO: this means that only the work creator can access the settings.
             * Maybe it should be anyone on the permissions list of the work?
             */
            if (this.state.selected_creator != this.state.current_user.eppn) {
                this.ui.toast.create_toast("You don't have the permission to do this action");
            } else {
                this.ui.show_settings();
            }
        });

        /**
         * Whitelist button in the settings screen
         */
        $(".litWhiteListButton").off().on("click", async () => {
            $("#whitelist-modal").modal({
                closeClass: 'icon-remove',
                closeText: '!',
                closeExisting: false,
            });

            $(".whiteListCheckBox").removeAttr("disabled");
            $(".whiteListCheckBoxSpan").children("label").removeClass("is-checked");

            // populate the whitelist with creators of the specified course
            let course_creators = this.courses_data.get_course_creators(this.state.selected_course);
            let course_creators_data = await course_creators;
            this.ui.populate_whitelist(course_creators_data);

            // check off the admins that are in the course
            let work_admins = this.works_data.get_admins_of_work(this.state.selected_creator, this.state.selected_work);
            let work_admins_data = await work_admins;
            this.ui.highlight_whitelist_admins(work_admins_data.admins);
        });

        /**
         * Work Data button in the settings screen
         * TODO:
         */
        $(".settingDataButton").off().on("click", () => {
            $("#workdata-modal").modal({
                closeClass: 'icon-remove',
                closeText: '!',
                closeExisting: false,
            });

            let tbody = $("#settingDataTable").find("tbody");
            tbody.empty();

            let isHeadCreated = $("#settingDataTable").find("thead").children().length;
            if (isHeadCreated) {
                createDataTableBody(this.state.selected_creator, this.state.selected_work);
            } else {
                createDataTableHeader();
                createDataTableBody(this.state.selected_creator, this.state.selected_work);
            }
        });

        /**
         * Delete Work button in the settings screen
         * 
         * TODO:
         */
        $(".deleteWorkButton").off().on("click", () => {
            if (confirm("Are you sure you want to delete the work " + this.state.selected_work + "?")) {
                deleteWork(this.state.selected_work, this.state.selected_creator, undefined);
            }
        });
    }
}
