export class UploadEvents {
    constructor({
        state = state,
        ui = ui,
        courses_data = courses_data,
        works_data = works_data,
    }) {
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
                    click: (event) => {
                        this.state.selected_upload_course =
                            event.currentTarget.textContent;

                        $("#upload-for-course").html(
                            this.state.selected_upload_course
                        );
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
     * Preload function for the write modal
     */
    async preload_write() {
        /**
         * Get course list to show for selection
         */
        let course_list = await this.courses_data.get_course_list();

        $("#writeLitBase").load("parts/write.htm", () => {
            const courses_options = $(".courseListForAddLit");

            for (let course in course_list) {
                let option = $("<li/>", {
                    class: "mdl-menu__item courseOptionForAddLit",
                    text: course_list[course],
                    click: (event) => {
                        this.state.selected_upload_course =
                            event.currentTarget.textContent;

                        $("#upload-for-course").html(
                            this.state.selected_upload_course
                        );
                    },
                });

                courses_options.append(option);
            }

            componentHandler.upgradeAllRegistered();

            /**
             * Bind events the upload button
             */
            this.postload_write();
        });
    }

    /**
     * Postload (happens after the request to get the .html of the upload)
     * Appends event listeners to the requested .html after rendering
     */
    postload() {
        let fileToSave;

        $("#addFileButton")
            .off()
            .on("change", function (e) {
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
                    $("#addNameInput").val(
                        fileName.substr(0, fileName.lastIndexOf(".")) ||
                            fileName
                    );
                }
            });

        $("#addUploadButton")
            .off()
            .on("click", async () => {
                let name = $("#addNameInput").val();
                let course = this.state.selected_upload_course;

                if (name == "" || name.length > 100) {
                    launchToastNotifcation(
                        "Please choose a file name no longer than 100 characters"
                    );
                } else if (/^[\s]+$/.test(name)) {
                    launchToastNotifcation("Please choose a valid file name.");
                } else if (!/^[a-zA-Z0-9_\-\.\s]+$/.test(name)) {
                    launchToastNotifcation(
                        "Please choose a file name without special characters"
                    );
                } else if (course == undefined) {
                    launchToastNotifcation(
                        "Please select a course before you update your work"
                    );
                } else {
                    let privacy = false;
                    if (
                        $("input[name='privacy-options']:checked").val() ==
                        "private"
                    ) {
                        privacy = true;
                    }

                    /**
                     * Immediately close the modal, thus network lag doesn't affect anything necessarily
                     */
                    $.modal.close();

                    let response = await this.works_data.upload_work({
                        work_name: name,
                        course: course,
                        privacy: privacy,
                        data: fileToSave,
                    });

                    if (response.status == "ok") {
                        this.ui.toast.create_toast(response.message);

                        setTimeout(() => {
                            let valid_pathname = window.location.pathname.replace(
                                "index.html",
                                "work.html"
                            );

                            valid_pathname = valid_pathname.replace(
                                "index.htm",
                                "work.html"
                            );

                            name = name.replaceAll(" ", "_");

                            window.location.href =
                                window.location.origin +
                                valid_pathname +
                                "?course=" +
                                course +
                                "&creator=" +
                                this.state.current_user.eppn +
                                "&work=" +
                                name;
                        }, 1000);
                    } else {
                        this.ui.toast.create_toast(response.message);
                    }
                }
            });
    }

    /**
     * Postload for write doc
     */
    postload_write() {
        /**
         * So technically I can use the state quill object
         * this.state.quill ...
         * But I'm going to hard-code a new quill instance here... Since they serve separate purposes...
         * I'm also rushing to get this feature implemented and there are definitely better ways but
         *  I can't be bothered to think too much on this nit... higher priorities rn.
         */
        const writerPage = new Quill("#writer-container", {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline"],
                    ["image", "code-block"],
                ],
            },
            placeholder: "Compose an document...",
            theme: "snow",
        });

        $("#addUploadButton")
            .off()
            .on("click", async (event) => {
                let name = $("#addNameInput").val();
                let course = this.state.selected_upload_course;

                if (name == "" || name.length > 100) {
                    launchToastNotifcation(
                        "Please choose a file name no longer than 100 characters"
                    );
                } else if (/^[\s]+$/.test(name)) {
                    launchToastNotifcation("Please choose a valid file name.");
                } else if (!/^[a-zA-Z0-9_\-\.\s]+$/.test(name)) {
                    launchToastNotifcation(
                        "Please choose a file name without special characters"
                    );
                } else if (course == undefined) {
                    launchToastNotifcation(
                        "Please select a course before you update your work"
                    );
                } else {
                    let privacy = false;

                    if (
                        $("input[name='privacy-options']:checked").val() ==
                        "private"
                    ) {
                        privacy = true;
                    }

                    /**
                     * Immediately close the modal, thus network lag doesn't affect anything necessarily
                     */
                    $.modal.close();

                    let response = await this.works_data.upload_work({
                        work_name: name,
                        course: course,
                        privacy: privacy,
                        data: btoa(encodeURIComponent(writerPage.getHTML())),
                    });

                    $("#writer-container").empty();

                    if (response.status == "ok") {
                        this.ui.toast.create_toast(response.message);

                        /**
                         * Honestly not sure why I put a timeout here.
                         * I only would've for a good reason... But I can't remember why...
                         */
                        setTimeout(() => {
                            let valid_pathname = window.location.pathname.replace(
                                "index.html",
                                "work.html"
                            );

                            valid_pathname = valid_pathname.replace(
                                "index.htm",
                                "work.html"
                            );

                            name = name.replaceAll(" ", "_");

                            window.location.href =
                                window.location.origin +
                                valid_pathname +
                                "?course=" +
                                course +
                                "&creator=" +
                                this.state.current_user.eppn +
                                "&work=" +
                                name;
                        }, 1000);
                    } else {
                        this.ui.toast.create_toast(response.message);
                    }
                }
            });
    }
}
