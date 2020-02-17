export class AddCourseEvents {
    constructor({ state = state, ui = ui, courses_data = courses_data }) {
        console.log("BaseEventBinds/AddCourseEvent Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
    }

    /**
     * Preload
     */
    async preload() {
        // First check if the user is the course admin
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
        $(".course-create-select-semester").off().on("click", item => {
            $("#course-create-semester").val(item.originalEvent.target.innerHTML);
        });

        // Enable the click event on the courseAdd button
        $("#courseadd").off().on("click", async () => {
            this.ui.show_add_course_page();
            this.postload();
        });
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {
        $("#finishAddCourseButton").off().on("click", async () => {
            if ($("#courseNameInput").val() == "") {
                launchToastNotifcation("Input the course code");
            } else if ($("#course-create-semester").val() == "") {
                launchToastNotifcation("Select a semester");
            } else if ($("#course-create-year").val() == "") {
                launchToastNotifcation("Select a year");
            } else {
                let section = $("#courseSectionInput").val() == "" ? "" : $("#courseSectionInput").val();
                let courseName = $("#courseSectionInput").val() != "" ? $("#courseNameInput").val() + "." + section + " - " + $("#course-create-semester").val() + " " + $("#course-create-year").val() : $("#courseNameInput").val() + " - " + $("#course-create-semester").val() + " " + $("#course-create-year").val();
                let addCourse_respond = await this.courses_data.add_course(courseName);
                launchToastNotifcation(addCourse_respond);
                $("#home").click();
                $.modal.close();
            }
        });
    }
}
