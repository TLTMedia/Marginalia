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
            $("#courseadd").show();
        } else if (is_currentuser_admin === "user") {
            $("#courseadd").attr("disable", "disabled").hide();
        }

        // Enable the click event on the courseAdd button
        $("#courseadd").off().on("click", async () => {
            this.ui.show_add_course_page();
            this.ui.populate_add_course_term_list();
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
                launchToastNotifcation("Please put in course name before adding the course");
            } else if ($("#selectedTerm").val() == "") {
                launchToastNotifcation("Please select a term before adding the course");
            } else {
                let section = $("#courseSectionInput").val() == "" ? "" : $("#courseSectionInput").val();
                let courseName = $("#courseSectionInput").val() != "" ? $("#courseNameInput").val() + "." + section + " - " + $("#selectedTerm").val() : $("#courseNameInput").val() + " - " + $("#selectedTerm").val();
                console.log(courseName)
                let addCourse_respond = await this.courses_data.add_course(courseName);
                launchToastNotifcation(addCourse_respond);
                $("#home").click();
                $.modal.close();
            }
        });
    }
}
