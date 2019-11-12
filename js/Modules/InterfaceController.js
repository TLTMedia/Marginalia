import { BaseEventBinds, InterfaceEvents } from './_ModuleLoader.js';
import { CommentsController, RangyController, CommentBoxController } from './Controllers/_ModuleLoader.js';

export class InterfaceController {
    constructor({ state = state, toast = toast }) {
        console.log("InterfaceController Module Loaded");

        this.state = state;
        this.toast = toast;

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
            whitelist_list: ".select2-whitelist-select",
        };

        /**
         * String Constants
         */
        this.string_constants = {
            dropdown_menu_options_class: "menuOptions",
        };

        /**
         * Comments Controller
         */
        this.comments_controller = new CommentsController({
            state: state,
            ui: this,
        });

        /**
         * CommentBox Controller
         */
        this.commentbox_controller = new CommentBoxController({
            state: state,
            ui: this,
        });

        /**
         * Rangy Controller
         */
        this.rangy_controller = new RangyController({
            state: state,
            ui: this,
        });

        /**
         * Events for whole pages
         */
        this.base_events = new BaseEventBinds({
            state: state,
            ui: this,
        });

        /**
         * Events for particular parts of the interface... TODO: deprecate.
         */
        this.ui_events = new InterfaceEvents({
            state: state,
            ui: this,
        });

        /**
         * TODO:
         * I kind of want to avoid having data classes be used here (rather the data should be passed in...)
         * this.state.api_data usage deprecate...
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

        // $(menu).parent().next().children(".selection").children().children()[0].innerHTML = "Select a course...";

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

        const course_item = $("<option/>", {
            value: course_name,
            text: course_name,
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
        $(".select2-user-select").select2("destroy");
        $(".select2-user-select").select2({
            placeholder: "Select a user",
        });

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

        const user_item = $("<option/>", {
            value: user_name.eppn,
            text: user_name.firstName + " " + user_name.lastName,
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
        $(".select2-work-select").select2("destroy");
        $(".select2-work-select").select2({
            placeholder: "Select a document",
        });

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

        const work_item = $("<option/>", {
            value: work,
            text: work,
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
     * Populate Whitelist & selects the admins
     * TODO: string constants
     */
    populate_whitelist(user_list, admin_list) {
        $(this.class_constants.whitelist_list).empty();

        user_list.forEach(user => {
            let user_option = $("<option/>", {
                value: user.eppn,
                text: user.firstName + " " + user.lastName,
            });

            if (admin_list.includes(user.eppn)) {
                user_option.prop("selected", "selected");
            }

            $(this.class_constants.whitelist_list).append(user_option);
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
            await this.build_html_file(data.data);

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

    /**
     * TODO:
     * Loads the user's works folder and creates a button for each work they have
     * When the button is clicked the variable userFolderSelected is the work's name
     * The cooresponding work then has it's text and comment/reply data loaded
     */
    async build_html_file(lit_data) {
        /**
         * Make the comment box,
         * TODO: this stuff breaks if it was already made, so find a way to only make these boxes once.
         */
        this.commentbox_controller.create_commentbox();

        makeDraggableReplyBox();
        hideAllBoxes();

        let footer;
        let titleAndTip = createWorkTitle(this.state.selected_work);

        let litDiv = $("<div/>", {
            "id": "litDiv"
        });

        let metaChar = $("<meta/>", {
            "charset": "utf-8"
        });

        let metaName = $("<meta/>", {
            "name": "viewport",
            "content": 'width=device-width, initial-scale=1.0'
        });

        let link = $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            media: "only screen",
            href: "css/style.css"
        });

        let preText = $("<div/>", {
            "id": "textSpace"
        });

        preText.html(lit_data);
        litDiv.append(metaChar, metaName, link, preText);
        titleAndTip[0].prepend(titleAndTip[1]);
        $("#text").append(titleAndTip[0], litDiv);
        $("#text").append(footer);


        /**
         * TODO: Get the comment data/highlights for the currently selected work
         */
        await this.comments_controller.load_user_comments();
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
