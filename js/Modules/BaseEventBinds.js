import { MainMenuEvents, UploadEvents, SettingsEvents, HomeEvents } from './BaseEventBinds/_ModuleLoader.js';

export class BaseEventBinds {
    constructor({ state = state, ui = ui, courses_data = courses_data, works_data = works_data, comments_data = comments_data }) {
        console.log("BaseEventBinds Module Loaded");

        this.state = state;
        this.ui = ui;
        this.courses_data = courses_data;
        this.works_data = works_data;
        this.comments_data = this.comments_data;

        /**
         * Events binded on the whole page
         */
        this.home_events = new HomeEvents({
            state: state,
            base_events: this,
            ui: ui,
            courses_data: courses_data,
        });
        this.main_menu_events = new MainMenuEvents({
            state: state,
            base_events: this,
            ui: ui,
        });
        this.upload_events = new UploadEvents({
            state: state,
            ui: ui,
            courses_data: courses_data,
            works_data: works_data,
        });
        this.settings_events = new SettingsEvents({
            state: state,
            ui: ui,
            courses_data: courses_data,
            works_data: works_data,
            comments_data: comments_data,
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
    }
}
