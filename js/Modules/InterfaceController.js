import { BaseEventBinds, InterfaceEvents } from './_ModuleLoader.js';

export class InterfaceController {
    constructor({ state = state, toast = toast }) {
        console.log("InterfaceController Module Loaded");

        /**
         * String Constants of Ids
         */
        this.id_constants = {
            main_lit_text: "#text",
            main_marginalia_data_form: "#cardbox",
            main_sub_menu: "#header-sub-menu",
            main_marginalia_first_page: "#firstPage",
        };

        /**
         * String Constants of Classes
         */
        this.class_constants = {
            courses_menu_section: ".courseSelectMenu",
            courses_dropdown_menu: ".coursesMenu",
            users_menu_section: ".userSelectMenu",
            users_dropdown_menu: ".usersMenu",
            works_menu_section: ".workSelectMenu",
            works_dropdown_menu: ".worksMenu",
            whitelist_list: ".whiteList",
        };

        /**
         * String Constants
         */
        this.string_constants = {
            dropdown_menu_options_class: "menuOptions",
        };

        this.state = state;
        this.toast = toast;

        this.base_events = new BaseEventBinds({
            state: state,
            ui: this,
        });

        this.ui_events = new InterfaceEvents({
            state: state,
            ui: this,
        });

        /**
         * TODO:
         * I kind of want to avoid having data classes be used here (rather the data should be passed in...)
         */
    }

    /**
     * Populates the courses dropdown with course options
     *
     * @param {Array} courses_list An array of course name strings
     * @returns {Boolean} true if success, false on error
     */
    populate_courses_dropdown(courses_list) {
        const menu_section_users = $(this.class_constants.users_menu_section);
        const menu_section_works = $(this.class_constants.works_menu_section);
        const menu = $(this.class_constants.courses_dropdown_menu);

        /** Empty out the menu if there's any existing choices */
        menu.empty();

        if (courses_list.length == 0) {
            return true;
        }

        for (let course in courses_list) {
            if (this.append_course_dropdown(courses_list[course])) {
                continue;
            } else {
                console.error("An error occured while appending to the course dropdown menu");

                return false;
            }
        }

        menu_section_users.hide();
        menu_section_works.hide();

        return true;
    }

    /**
     * Appends a single course choice to the dropdown.
     * Mostly used as a helper for populate_courses_dropdown(), but can also be used for
     * dynamically adding more choices without having to re-create the whole list
     *
     * @param {String} course_name Name of a course
     * @returns {Boolean} true on success, false on error
     */
    append_course_dropdown(course_name) {
        const menu = $(this.class_constants.courses_dropdown_menu);

        const course_item = $("<li/>", {
            class: "mdl-list__item " + this.string_constants.dropdown_menu_options_class,
            text: course_name,
            click: () => {
                this.ui_events.click_course_option(event, course_name);
            }
        });

        menu.append(course_item);

        return true;
    }

    /**
     * Populates the users dropdown with user options
     *
     * @param {Array} users_list An array of users name strings
     * @returns {Boolean} true if success, false on error
     */
    populate_users_dropdown(users_list) {

        const menu_section_users = $(this.class_constants.users_menu_section);
        const menu_section_works = $(this.class_constants.works_menu_section);
        const menu = $(this.class_constants.users_dropdown_menu);

        menu_section_works.hide("slide", {
            direction: "up"
        }, 300);

        /** Empty out the menu if there's any existing choices */
        menu.empty();

        if (users_list.length == 0) {
            menu_section_users.hide("slide", {
                direction: "up"
            }, 300);

            this.toast.create_toast("There are no users in this course");

            return true;
        }

        for (let user in users_list) {
            if (this.append_user_dropdown(users_list[user])) {
                continue;
            } else {
                console.error("An error occured while appending to the user dropdown menu");

                return false;
            }
        }

        menu_section_users.finish().show("slide", {
            direction: "up"
        }, 300);

        return true;
    }

    /**
     * Appends a single course choice to the dropdown.
     * Mostly used as a helper for populate_users_dropdown(), but can also be used for
     * dynamically adding more choices without having to re-create the whole list
     *
     * @param {String} user_name Name of a user
     * @returns {Boolean} true on success, false on error
     */
    append_user_dropdown(user_name) {
        const menu = $(this.class_constants.users_dropdown_menu);

        const user_item = $("<li/>", {
            class: "mdl-list__item " + this.string_constants.dropdown_menu_options_class,
            text: user_name.firstName + " " + user_name.lastName,
            click: () => {
                this.ui_events.click_user_option(event, user_name.eppn);
            }
        });

        menu.append(user_item);

        return true;
    }

    /**
     * Populates the works dropdown with works options
     *
     * @param {Array} works_list An array of works name strings
     * @returns {Boolean} true if success, false on error
     */
    populate_works_dropdown(works_list) {
        const menu_section = $(this.class_constants.works_menu_section);
        const menu = $(this.class_constants.works_dropdown_menu);

        /** Empty out the menu if there's any existing choices */
        menu.empty();

        if (works_list.length == 0) {
            menu_section.hide("slide", {
                direction: "up"
            }, 300);

            this.toast.create_toast("There are no works in this for this user in this course");

            return true;
        }

        for (let work in works_list) {
            if (this.append_work_dropdown(works_list[work])) {
                continue;
            } else {
                console.error("An error occured while appending to the work dropdown menu");

                return false;
            }
        }

        menu_section.finish().show("slide", {
            direction: "up"
        }, 300);

        return true;
    }

    /**
     * Appends a single work choice to the dropdown.
     * Mostly used as a helper for populate_works_dropdown(), but can also be used for
     * dynamically adding more choices without having to re-create the whole list
     *
     * @param {String} work Name of a work
     * @returns {Boolean} true on success, false on error
     */
    append_work_dropdown(work) {
        const menu = $(this.class_constants.works_dropdown_menu);

        const work_item = $("<li/>", {
            class: "mdl-list__item " + this.string_constants.dropdown_menu_options_class,
            text: work,
            click: () => {
                this.ui_events.click_work_option(event, work);
            }
        });

        menu.append(work_item);

        return true;
    }

    /**
     * Clear the user selection dropdown
     */
    clear_user_selection() {
        const menu = $(this.class_consants.users_dropdown_menu);

        menu.empty();
    }

    /**
     * Clear the work selection dropdown
     */
    clear_work_selection() {
        const menu = $(this.class_constants.works_dropdown_menu);

        menu.empty();
    }

    /**
     * Show the sub-menu
     */
    show_sub_menu() {
        const menu = $(this.id_constants.main_sub_menu);
        menu.css({
            "top": 64,
        });

        menu.show();
    }

    /**
     * Hide the sub-menu
     */
    hide_sub_menu() {
        const menu = $(this.id_constants.main_sub_menu);
        menu.css({
            "top": -64,
        });

        menu.show();
    }

    /**
     * Show the main cardbox
     * NOTE: this now actually shows the firstPage()
     */
    show_main_cardbox() {
        // const menu = $(this.id_constants.main_marginalia_data_form);
        const menu = $(this.id_constants.main_marginalia_first_page);

        menu.show();
    }

    /**
     * Hide the main cardbox
     * NOTE: this now actually hides the firstPage()
     */
    hide_main_cardbox() {
        // const menu = $(this.id_constants.main_marginalia_data_form);
        const menu = $(this.id_constants.main_marginalia_first_page);

        menu.hide();
    }

    /**
     * Hide the work page
     */
    hide_work_page() {
        $("#text-wrapper").hide();
    }

    /**
     * Show home page; which inclues the main cardbox.
     * TODO:
     */
    show_home_page() {
        // removes the hash from the url
        history.pushState(null, null, ' ');

        // show the main cardbox again
        this.show_main_cardbox();

        // TODO:
        //$("#text , .userFiles, #addLitBase").hide();
        // $("#settingsBase").hide();
        $("#nonTitleContent").show();
        $(".userSelectMenu, .workSelectMenu").hide();
        $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
        // $("#setting").addClass("disabledHeaderTab");
        $(".headerTab").removeClass("active");
        $("#home").addClass("active");
        hideAllBoxes();
    }

    /**
     * TODO:
     * Show settings menu
     */
    show_settings() {
        let course = this.state.selected_course;
        let selectedLitId = this.state.selected_work;
        let selected_eppn = this.state.selected_creator;

        $("#settings-modal").modal({
            closeClass: 'icon-remove',
            closeText: '!'
        });

        $("#settingTitle").text("Settings:" + " " + selected_eppn + " - " + decodeURI(selectedLitId));
    }

    /**
     * Show filters menu
     */
    show_filters() {
        $("#filters-modal").modal({
            closeClass: 'icon-remove',
            closeText: '!'
        });
    }

    /**
     * Show add course page
     */
    show_add_course_page() {
        $("#add-course-modal").modal({
            closeClass: 'icon-remove',
            closeText: '!'
        });
    }

    /**
     * Populate Whitelist
     * TODO: string constants
     */
    populate_whitelist(user_list) {
        $(this.class_constants.whitelist_list).empty();

        for (let i in user_list) {
            let user = $("<li/>", {
                text: user_list[i]["firstName"] + " " + user_list[i]["lastName"],
                class: 'mdl-list__item whiteListOption',
                commenterId: user_list[i]["eppn"]
            });

            let span = $("<span/>", {
                class: "mdl-list__item-secondary-action whiteListCheckBoxSpan"
            });

            let label = $("<label/>", {
                class: "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect",
                for: "wl_" + user_list[i]["eppn"]
            });

            let input = $("<input/>", {
                class: "mdl-checkbox__input whiteListCheckBox",
                type: "checkbox",
                id: "wl_" + user_list[i]["eppn"]
            });

            $(label).append(input);
            $(span).append(label);
            $(user).append(span);
            $(this.class_constants.whitelist_list).append(user);
        }

        componentHandler.upgradeAllRegistered();
    }

    /**
     * Highlight whitelist admins
     * TODO: string constants
     */
    highlight_whitelist_admins(admin_list) {
        for (let i = 0; i < admin_list.length; i++) {
            let whiteListUser = admin_list[i];
            let inputs = $(".whiteList").find("input");

            for (let j = 0; j < inputs.length; j++) {
                if (inputs[j]["id"].split("_")[1] == whiteListUser) {
                    $("#" + escapeSpecialChar(inputs[j]["id"])).off().click();
                }
            }
        }

        // disable the creator from the whitelist
        $("#" + escapeSpecialChar("wl_" + this.state.selected_creator)).attr("disabled", true);

        $(".whiteListCheckBox").off().on("change", async event => {
            await this.ui_events.click_user_on_whitelist(event);
        });
    }

    /**
     * Render a specified work (selectLit)
     */
    async render_literature() {
        const render_area = $(this.id_constants.main_lit_text);

        // empty out the old work
        render_area.empty();

        // get the work data
        let data = await this.state.api_data.works_data.get_work_data();
        if (data.status == "ok") {
            // set the deep link
            $.address.value("get_work/" + this.state.selected_course + "/" + this.state.selected_creator + "/" + this.state.selected_work);

            // TODO:
            buildHTMLFile(data.data, this.state.selected_creator, this.state.selected_work);

            // update the settings page
            await this.base_events.settings_events.postload();

            // NOTE: / TODO: we are getting the comment data here & in buildHTMLFile... When I recode buildHTMLFile,
            // take note of it already being called here. (should be able to use it?)
            let work_comment_data = await this.state.api_data.comments_data.get_work_highlights();

            // reset the filters - this happens here b.c. filters menu persists changes unless work is changed
            this.base_events.filters_events.reset(work_comment_data);

            // TODO:
            checkworkAdminList(this.state.selected_creator, this.state.selected_work, "approvedComments");
        } else {
            this.toast.create_toast("Error loading work. \n" + data.data);

            // work doesn't exist so load home
            $("#home").click();
        }
    }

    populate_add_course_term_list() {
        let today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();
        let season = ["Spring", "Summer", "Fall", "Winter"];
        let years = [year, year + 1];

        if ($(".termsListForAddCourse").children("li").length == 0) {
            for (let i in years) {
                for (let j in season) {
                    let text = season[j] + "_" + years[i];
                    let termOption = $("<li/>", {
                        class: "mdl-menu__item",
                        text: text,
                        click: () => {
                            $("#selectedTerm").val(text).html(text);
                            $("#termMenuButton").click();
                        }
                    });
                    $(".termsListForAddCourse").append(termOption);
                }
            }
        }
    }

    show_tutorial() {
        showTutorialPage(this);
    }
}
