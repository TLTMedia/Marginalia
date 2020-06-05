import { MainMenuEvents, UploadEvents, SettingsEvents, HomeEvents, FiltersEvents, AddCourseEvents } from './BaseEventBinds/_ModuleLoader.js';

export class BaseEventBinds {
    constructor({ state = state, ui = ui }) {
        console.log("BaseEventBinds Module Loaded");

        this.state = state;
        this.ui = ui;

        /**
         * Events binded on the whole page
         */
        this.home_events = new HomeEvents({
            state: state,
            base_events: this,
            ui: ui,
            courses_data: state.api_data.courses_data,
        });

        this.main_menu_events = new MainMenuEvents({
            state: state,
            base_events: this,
            ui: ui,
        });

        this.upload_events = new UploadEvents({
            state: state,
            ui: ui,
            courses_data: state.api_data.courses_data,
            works_data: state.api_data.works_data,
        });

        this.settings_events = new SettingsEvents({
            state: state,
            ui: ui,
            courses_data: state.api_data.courses_data,
            works_data: state.api_data.works_data,
            comments_data: state.api_data.comments_data,
        });

        this.filters_events = new FiltersEvents({
            state: state,
            ui: ui,
            base_events: this,
        });

        this.addCourse_events = new AddCourseEvents({
            state: state,
            ui: ui,
            courses_data: state.api_data.courses_data,
            users_data: state.api_data.users_data,
        });
    }

    /**
     * Base events that need to be loaded immediately.
     * An exception being pages that are dynamically generated
     * (be it via ajax etc... e.g.: UploadEvents.preload() is only called when main-menu
     * button add-lit is clicked)
     */
    async init() {
        /**
         * Events for the home page
         */
        await this.home_events.preload();

        /**
         * Events for the main menu
         */
        this.main_menu_events.preload();

        /**
         * Events for the settings modal
         */
        this.settings_events.preload();

        /**
         * Events for the filters modal
         */
        this.filters_events.preload();

        /**
         * Events for the add Course modal
         */
        this.addCourse_events.preload();
    }
}
