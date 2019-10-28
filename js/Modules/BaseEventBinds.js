export class BaseEventBinds {
    constructor({ state = state, ui = ui }) {
        console.log("BaseEventBinds Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * Bind events for the home page
     */
    home_init() {
        $("#home").off().on("click", () => {
            this.ui.hide_sub_menu();
            this.ui.show_home_page();
        });
    }
}
