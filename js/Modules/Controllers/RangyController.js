export class RangyController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/RangyController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * TODO: not yet used. still using old.
     * Unhighlight an area via Rangy.
     */
    unhighlight() {
        this.state.rem_span = "hl_" + this.state.current_user.eppn;

        let text = $("." + escapeSpecialChar(this.state.rem_span)).text();

        $("." + escapeSpecialChar(this.state.rem_span)).contents().unwrap();

        return text;
    }

    highlight() {

    }
}
