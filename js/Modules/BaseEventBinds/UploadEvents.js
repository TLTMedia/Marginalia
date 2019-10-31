export class UploadEvents {
    constructor({ state = state, ui = ui, courses_data = courses_data, works_data = works_data }) {
        console.log("BaseEventBinds/UploadEvents Submodule Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
        this.works_data = works_data;
    }

    /**
     * Preload
     */
    async preload() {
        /**
         * Get course list to show for selection
         */
        let course_list = await this.courses_data.get_course_list();

        $("#addLitBase").load("parts/upload.htm", () => {
            const courses_options = $(".courseListForAddLit");
            for (let course in course_list) {
                let option = $("<li/>", {
                    class: "mdl-menu__item courseOptionForAddLit",
                    text: course_list[course],
                    click: event => {
                        this.state.selected_upload_course = event.currentTarget.textContent;
                        $("#upload-for-course").html(this.state.selected_upload_course);
                    },
                });

                courses_options.append(option);
            }

            componentHandler.upgradeAllRegistered();

            /**
             * Bind events the upload button
             */
            this.postload();
        });
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {
        let fileToSave;

        $("#addFileButton").on("change", function (e) {
            let tmpFileToSave = e.target.files[0];
            if (tmpFileToSave === undefined || tmpFileToSave === null) {
                // Can occur when user cancels file-choosing view
                return;
            } else {
                fileToSave = tmpFileToSave;
            }

            let fileName = fileToSave.name;
            if (fileName.length > 100) {
                alert("File name can't exceed 100 characters");
                return;
            }

            // $("#fileName").text(fileName);
            $(".nameContainer").show();

            if ($("#addNameInput").val().length > 0) {
                // don't do anything because the user already typed in a name and we don't want to overwrite it.
            } else {
                $("#addNameInput").val(fileName.substr(0, fileName.lastIndexOf('.')) || fileName);
            }
        });

        $("#addUploadButton").on("click", async () => {
            let name = $("#addNameInput").val();
            let course = this.state.selected_upload_course;

            if (name == "" || name.length > 100) {
                launchToastNotifcation("Please choose a file name no longer than 100 characters");
            } else if (/^[\s]+$/.test(name)) {
                launchToastNotifcation("Please choose a valid file name.");
            } else if (!/^[a-zA-Z0-9_\-\.\s]+$/.test(name)) {
                launchToastNotifcation("Please choose a file name without special characters");
            } else if (course == undefined) {
                launchToastNotifcation("Please select a course before you update your work");
            } else {
                let privacy = false;
                if ($("input[name='privacy-options']:checked").val() == "private") {
                    privacy = true;
                }

                let response = await this.works_data.upload_work({
                    work_name: name,
                    course: course,
                    privacy: privacy,
                    data: fileToSave,
                });

                if (response.status == "ok") {
                    this.ui.toast.create_toast(response.message);

                    /**
                     * Creating the work was successful, hence close the upload modal.
                     */
                    $.modal.close();
                } else {
                    this.ui.toast.create_toast(response.message);
                }
            }
        });

        $("#helpForAddLit").off().on("click", () => {
            let tutorialData = [
                [
                    ".fileContainer",
                    1,
                    "Select a file from your device"
                ],
                [
                    ".nameContainer",
                    2,
                    "Name your work"
                ],
                [
                    ".addLitCourseMenu",
                    3,
                    "Select a course that you want to upload your work for"
                ],
                [
                    ".privateContainer",
                    4,
                    "Check the box if you want your work to be private. (you are able to change your work's privacy after you upload it)"
                ],
                [
                    "#addUploadButton",
                    5,
                    "Click to upload"
                ]
            ];

            let specialStepData = {};

            makeTutorial(tutorialData);
            startTutorial(tutorialData, specialStepData);
        });
    }
}