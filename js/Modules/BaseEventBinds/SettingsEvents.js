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
        $("#setting").off().on("click", async () => {
            let work_admins = await this.works_data.get_admins_of_work();

            if (!work_admins.admins.includes(this.state.current_user.eppn)) {
                this.ui.toast.create_toast("You don't have permission to do this action.");
            } else {
                /**
                 * Get the course creators
                 * This gets the admins of a course
                 */
                let course_creators = await this.courses_data.get_course_creators();
                this.ui.populate_whitelist(course_creators, work_admins.admins);

                /**
                 * Show the settings modal.
                 */
                this.ui.show_settings();
            }
        });

        /**
         * Event handler for adding to the whitelist
         */
        $(".select2-whitelist-select").on("select2:select", async event => {
            let response = await this.state.api_data.works_data.add_work_permission(event.params.data.id);
            this.ui.toast.create_toast(response);
        });

        /**
         * Event handler for removing from the whitelist
         */
        $(".select2-whitelist-select").on("select2:unselecting", async event => {
            /**
             * Prevent de-selecting of the creator of the work
             */
            if (event.params.args.data.id == this.state.selected_creator) {
                this.ui.toast.create_toast("You cannot remove the creator of the document.", "warning");

                event.preventDefault();
                return;
            }

            /**
             * TODO: Keep below? 
             * Should they be allowed to remove themselves from the admin list - if they aren't the course owned
             * Prevent de-selecting of yourself
             */
            if (event.params.args.data.id == this.state.current_user.eppn) {
                this.ui.toast.create_toast("You cannot remove yourself.", "warning");

                event.preventDefault();
                return;
            }

            let response = await this.state.api_data.works_data.remove_work_permission(event.params.args.data.id);
            this.ui.toast.create_toast(response);
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
