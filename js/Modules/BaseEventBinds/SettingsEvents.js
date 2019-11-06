export class SettingsEvents {
    constructor({ state = state, ui = ui, courses_data = courses_data, works_data = works_data, comments_data = comments_data }) {
        console.log("BaseEventBinds/SettingsEvents Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
        this.works_data = works_data;
        this.comments_data = comments_data;
    }

    /**
     * Preload (happens before the request to get the .html of the upload)
     */
    preload() {
        /**
         * Settings button in the sub-menu
         */
        $("#setting").off().on("click", () => {
            /**
             * TODO: this means that only the work creator can access the settings.
             * Maybe it should be anyone on the permissions list of the work?
             * (David :I thought we already discuss this before that only the creator is allow to do the settings)
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
         */
        $(".deleteWorkButton").off().on("click", async () => {
            if (confirm("Are you sure you want to delete the work " + this.state.selected_work + "?")) {
                let res = await this.works_data.delete_work();
                this.ui.toast.create_toast(res);

                // close the currently highlighted (settings) modal b/c the work no longer exists
                $.modal.close();

                // hide the sub menu
                this.ui.hide_sub_menu();

                // hide the work
                this.ui.hide_work_page();

                // open the home page
                this.ui.show_home_page();
            }
        });
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    async postload() {
        /**
         * Necessary, otherwise it'll show a toast saying X was set to true/false
         */
        $("#privacySwitch").off();
        $("#commentsNeedApprovalSwitch").off();

        /**
         * Set the default value of the work privacy
         */
        let current_privacy = await this.works_data.get_work_privacy();
        if (current_privacy == "false") {
            if (!$("#privacySwitch")[0].checked) {
                $("#privacySwitch").addClass("disabled").click();
                $("#privacySwitch").removeClass("disabled");
            }
        } else {
            if ($("#privacySwitch")[0].checked) {
                $("#privacySwitch").addClass("disabled").click();
                $("#privacySwitch").removeClass("disabled");
            }
        }

        /**
         * Set the default value of the comments require approval
         */
        let comments_approval = await this.comments_data.get_comments_require_approval();
        if (comments_approval == "true") {
            if (!$("#commentsNeedApprovalSwitch")[0].checked) {
                $("#commentsNeedApprovalSwitch").addClass("disabled").click();
                $("#commentsNeedApprovalSwitch").removeClass("disabled");
            }
        } else {
            if ($("#commentsNeedApprovalSwitch")[0].checked) {
                $("#commentsNeedApprovalSwitch").addClass("disabled").click();
                $("#commentsNeedApprovalSwitch").removeClass("disabled");
            }
        }

        /**
         * Toggle the work privacy
         */
        $("#privacySwitch").off().on("change", async () => {
            let privacy;

            if ($("#privacySwitch")[0].checked) {
                privacy = false;
            } else {
                privacy = true;
            }

            let response = await this.works_data.set_work_privacy(privacy);
            this.ui.toast.create_toast(response);
        });

        /**
         * Toggle whether the work's comments require approval
         */
        $("#commentsNeedApprovalSwitch").off().on("change", async () => {
            let approval;

            if ($("#commentsNeedApprovalSwitch")[0].checked) {
                approval = true;
            } else {
                approval = false;
            }

            let response = await this.comments_data.set_comments_require_approval(approval);
            this.ui.toast.create_toast(response);
        });
    }
}
