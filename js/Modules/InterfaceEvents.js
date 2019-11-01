export class InterfaceEvents {
    constructor({ state = state, users_data = users_data, works_data = works_data, ui = ui }) {
        console.log("InterfaceEvents Module Loaded");

        this.state = state;
        this.users_data = users_data;
        this.works_data = works_data;
        this.ui = ui;
    }

    async click_course_option(event, course) {
        this.state.selected_course = course;

        let users = await this.users_data.get_selected_course_users(course);

        if (!this.ui.populate_users_dropdown(users)) {
            console.error("error while attempting to populate courses dropdown");
        }

        this.ui.clear_work_selection();
    }

    async click_user_option(event, creator) {
        this.state.selected_creator = creator;

        let works = await this.works_data.get_selected_course_works(this.state.selected_course, creator);

        if (!this.ui.populate_works_dropdown(works)) {
            console.error("error while attempting to populate works dropdown");
        }
    }

    async click_work_option(event, work) {
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

    async click_user_on_whitelist(event) {
        let eppn_modify = event.currentTarget.id.split("_")[1];

        /**
         * NOTE: The eppn passed in is the eppn of the user to add to the list,
         * It's assumed that the "work" (for these 2 endpoints) is the currently logged in user.
         */
        let res;
        if ($("#wl_" + escapeSpecialChar(eppn_modify)).is(":checked")) {
            res = await this.works_data.add_work_permission(this.state.selected_work, eppn_modify);
        } else {
            res = await this.works_data.remove_work_permission(this.state.selected_work, eppn_modify);
        }

        this.ui.toast.create_toast(res);
    }

    bind_redirect_confirmation(specificElement) {
        $(specificElement).on("click", function (event) {
            if (($(specificElement).attr("href")).indexOf(window.location.host) !== -1) {
                // console.log("do nothing is same host");
            } else if (($(specificElement).attr("href")).indexOf("javascript:void(0);") !== -1) {
                // console.log("do nothing is javascript void event");
            } else if ($(specificElement).attr("href").charAt(0) == "#") {
                // console.log("do nothing is just hash placeholder tag");
            } else {
                event.preventDefault();
                let res = confirm("Are you sure you want to visit the URL:\n\n" + $(specificElement).attr("href"));
                if (res) {
                    window.location = $(specificElement).attr("href");
                } else {
                    return;
                }
            }
        });
    }

    do_course_search() {
        let list = $(".coursesMenu").find("li");
        let search_key = $(".searchCourse").val();

        list.each((_, element) => {
            let course_name = $(element).html();
            if (course_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }

    do_user_search() {
        let list = $(".usersMenu").find("li");
        let search_key = $(".searchUser").val();

        list.each((_, element) => {
            let user_name = $(element).html();
            if (user_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1) {
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
            if (work_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
    }
}