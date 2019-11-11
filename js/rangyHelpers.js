function unhighlight() {
    TMP_STATE.rem_span = "hl_" + TMP_STATE.current_user.eppn;
    console.log(TMP_STATE.rem_span);
    var text = $("." + escapeSpecialChar(TMP_STATE.rem_span)).text();
    $("." + escapeSpecialChar(TMP_STATE.rem_span)).contents().unwrap();
    return text;
}

function hlRange(selectedRange, range) {
    TMP_STATE.rem_span = ("hl_" + TMP_STATE.current_user.eppn);
    let applierCount = rangy.createClassApplier(TMP_STATE.rem_span, {
        useExistingElements: false,
        elementAttributes: {
            "startIndex": range.start,
            "endIndex": range.end,
        }
    });
    console.log("lit", $("#textSpace"));
    applierCount.applyToRange(selectedRange);
    return TMP_STATE.rem_span;
}

function escapeSpecialChar(id) {
    if (id == null) {
        return null;
    }
    return id.replace(/([\s!"#$%&'()\*+,\.\/:;<=>?@\[\]^`{|}~])/g, "\\$1");
}
