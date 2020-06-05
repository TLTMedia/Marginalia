export class RangyController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/RangyController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    /**
     * Unhighlight an area via Rangy.
     */
    unhighlight() {
        this.state.rem_span = "hl_" + this.state.current_user.eppn;

        let text = $("." + escapeSpecialChar(this.state.rem_span)).text();

        $("." + escapeSpecialChar(this.state.rem_span)).contents().unwrap();

        return text;
    }

    /**
     * Highlight a particular section via rangy.
     */
    highlight(selected_range, range) {
        this.state.rem_span = "hl_" + this.state.current_user.eppn;

        let applier_count = rangy.createClassApplier(this.state.rem_span, {
            useExistingElements: false,
            elementAttributes: {
                "startIndex": range.start,
                "endIndex": range.end,
            },
        });

        applier_count.applyToRange(selected_range);

        return this.state.rem_span;
    }
}
