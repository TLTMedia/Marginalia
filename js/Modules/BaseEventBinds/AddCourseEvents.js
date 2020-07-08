export class AddCourseEvents {
    constructor({
        state = state,
        ui = ui,
        courses_data = courses_data,
        users_data = users_data,
    }) {
        console.log("BaseEventBinds/AddCourseEvent Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
        this.users_data = users_data;
    }

    /**
     * Preload
     */
    async preload() {
        // First check if the user is a course admin
        let is_currentuser_admin = await this.courses_data.is_user_course_admin();
        if (is_currentuser_admin === "admin") {
            $("#courses-options").show();
        } else {
            $("#courses-options").attr("disable", "disabled").hide();
            return;
        }

        /**
         * Set the text box to the value of the selected course semester from dropdown
         */
        $(".course-create-select-semester")
            .off()
            .on("click", (item) => {
                $("#course-create-semester").val(
                    item.originalEvent.target.dataset.val
                );
            });

        // Enable the click event on the courseAdd button
        $("#courseadd")
            .off()
            .on("click", () => {
                this.ui.show_add_course_page();
                this.postload_course_add();
            });

        /**
         * Add a courses admin
         */
        $("#courses-admin-add")
            .off()
            .on("click", async () => {
                this.ui.show_add_admin_page();

                /**
                 * TODO: visually only shows the currently logged in user as the only admin
                 * (even tho there are others... get the admin list, but only let admins backend be able to read that,)
                 *
                 * TODO: make the search actually work for backend results.
                 */
                let all_users = await this.users_data.search_all_users(".");
                let course_admins = await this.courses_data.get_course_admins();

                this.ui.populate_course_admins(all_users, course_admins);
                this.postload_courses_admin();
            });
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload_course_add() {
        $("#finishAddCourseButton")
            .off()
            .on("click", async () => {
                if ($("#courseNameInput").val() == "") {
                    launchToastNotifcation("Input the course code");
                } else if ($("#course-create-semester").val() == "") {
                    launchToastNotifcation("Select a semester");
                } else if ($("#course-create-year").val() == "") {
                    launchToastNotifcation("Select a year");
                } else {
                    let section =
                        $("#courseSectionInput").val() == ""
                            ? ""
                            : $("#courseSectionInput").val();
                    let course_name =
                        $("#courseSectionInput").val() != ""
                            ? $("#courseNameInput").val() +
                              "." +
                              section +
                              " - " +
                              $("#course-create-semester").val() +
                              " " +
                              $("#course-create-year").val()
                            : $("#courseNameInput").val() +
                              " - " +
                              $("#course-create-semester").val() +
                              " " +
                              $("#course-create-year").val();

                    let add_course_response = await this.courses_data.add_course(
                        course_name
                    );
                    if (add_course_response) {
                        this.ui.append_course_dropdown(course_name, {
                            select2: true,
                        });
                        this.ui.toast.create_toast(add_course_response);
                        this.ui.toast.create_toast(
                            "Add a literature to the new course to view it!"
                        );
                        $.modal.close();
                        $("#litadd").click();
                    }
                }
            });
    }

    postload_courses_admin() {
        /**
         * Event handler for adding new courses admin
         */
        $(".select2-courses-adminlist-select")
            .off()
            .on("select2:select", async (event) => {
                let response = await this.courses_data.add_course_admin(
                    event.params.data.id
                );
                this.ui.toast.create_toast(response);
            });

        /**
         * Event handler for removing courses admin
         */
        $(".select2-courses-adminlist-select")
            .off()
            .on("select2:unselecting", async (event) => {
                /**
                 * Should they be allowed to remove themselves from the admin list - if they aren't the course owned
                 * Prevent de-selecting of yourself
                 */
                if (event.params.args.data.id == this.state.current_user.eppn) {
                    this.ui.toast.create_toast(
                        "You cannot remove yourself.",
                        "warning"
                    );

                    event.preventDefault();
                    return;
                }

                let response = await this.state.api_data.courses_data.remove_course_admin(
                    event.params.args.data.id
                );
                this.ui.toast.create_toast(response);
            });
    }
}
