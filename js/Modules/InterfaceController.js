import { BaseEventBinds, InterfaceEvents } from './ModuleLoader.js';

export class InterfaceController {
    constructor(state, modal, users_data, works_data) {
        console.log("InterfaceController Module Loaded");

        /**
         * String Constants of Ids
         */
        this.id_constants = {
            main_marginalia_data_form: "#cardbox",
            main_sub_menu: "#header-sub-menu",
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
        };

        /** 
         * String Constants 
         */
        this.string_constants = {
            dropdown_menu_options_class: "menuOptions",
        };

        this.state = state;
        this.modal = modal;

        this.page_events = new BaseEventBinds({ state: state, ui: this });
        this.ui_events = new InterfaceEvents(state, users_data, works_data, this);
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

            this.modal.create_toast("There are no users in this course");

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

            this.modal.create_toast("There are no works in this for this user in this course");

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
     * Filter the courses out
     */
    filter_courses_dropdown(list, search_key) {
        list.each((_, element) => {
            let course_name = $(element).html();
            if (course_name.toUpperCase().indexOf(search_key.toUpperCase()) != -1) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
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
     */
    show_main_cardbox() {
        const menu = $(this.id_constants.main_marginalia_data_form);

        menu.show();
    }

    /**
     * Hide the main cardbox
     */
    hide_main_cardbox() {
        const menu = $(this.id_constants.main_marginalia_data_form);

        menu.hide();
    }

    /**
     * Show home page; which inclues the main cardbox.
     */
    show_home_page() {
        // removes the hash from the url
        history.pushState(null, null, ' ');

        // show the main cardbox again
        this.show_main_cardbox();

        // TODO: 
        $("#text , .userFiles, #settingBase, #addLitBase").hide();
        $("#nonTitleContent").show();
        $(".userSelectMenu, .workSelectMenu").hide();
        $(".chosenUser, .chosenFile, .typeSelector, .commenterSelector").empty();
        // $("#setting").addClass("disabledHeaderTab");
        $(".headerTab").removeClass("active");
        $("#home").addClass("active");
        hideAllBoxes();
    }
}
