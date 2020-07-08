export class InterfaceEvents {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceEvents Module Loaded");

        this.state = state;
        this.ui = ui;

        this.data = state.api_data;
    }

    async click_course_option(course) {
        this.state.selected_course = course;

        let users = await this.data.users_data.get_selected_course_users(
            course
        );

        if (!this.ui.populate_users_dropdown(users)) {
            console.error("error while attempting to populate users dropdown");
        }

        this.ui.clear_work_selection();

        $(".select2-user-select").val("").trigger("change");
    }

    async click_user_option(creator) {
        this.state.selected_creator = creator;

        let works = await this.data.works_data.get_selected_course_works(
            this.state.selected_course,
            creator
        );

        if (!this.ui.populate_works_dropdown(works)) {
            console.error("error while attempting to populate works dropdown");
        }

        $(".select2-work-select").val("").trigger("change");
    }

    async click_work_option(work) {
        this.state.selected_work = work;

        /**
         * Hide the main cardbox/home page
         */
        this.ui.hide_main_cardbox();

        /**
         * Show the submenu for the work
         */
        this.ui.show_sub_menu();

        /**
         * Used to be selectLit, renders the currently selected literature.
         */
        this.ui.render_literature();
    }

    bind_redirect_confirmation(specificElement) {
        $(specificElement).on("click", function (event) {
            //was called without element having .attr("href")
            var elHref =
                $(specificElement).attr("href") || window.location.host;

            if (elHref.indexOf(window.location.host) !== -1) {
                // console.log("do nothing is same host");
            } else if (elHref.indexOf("javascript:void(0);") !== -1) {
                // console.log("do nothing is javascript void event");
            } else if (elHref.charAt(0) == "#") {
                // console.log("do nothing is just hash placeholder tag");
            } else {
                event.preventDefault();

                window.alert(
                    "URL: " +
                        $(specificElement).attr("href") +
                        "\n\nFor security purposes, we cannot redirect you to the specified link."
                );
                // let res = confirm("Are you sure you want to visit the URL:\n\n" + $(specificElement).attr("href"));
                // if (res) {
                //     window.location = elHref;
                // } else {
                //     return;
                // }
            }
        });
    }

    do_user_search() {
        let list = $(".usersMenu").find("li");
        let search_key = $(".searchUser").val();

        list.each((_, element) => {
            let user_name = $(element).html();
            if (
                user_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1
            ) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }

    do_work_search() {
        let list = $(".worksMenu").find("li");
        let search_key = $(".searchLit").val();

        list.each((_, element) => {
            let work_name = $(element).html();
            if (
                work_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1
            ) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }
}
