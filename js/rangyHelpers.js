var remSpan;

//applies the hl to the area selected by the user
function highlightCurrentSelection(evt, selectedType) {
    var selectedRange = rangy.getSelection().getRangeAt(0);
    var lightRange = lightrange.saveSelection();
    selectedRange["nativeRange"] = lightRange;
    $("#comment-box").removeAttr("data-replyToEppn data-replyToHash");
    $("#comment-box").attr("data-editcommentid", "-1");
    if (selectedRange.endOffset != selectedRange.startOffset) {
        unhighlight();
        TMP_STATE.quill.setText("");
        // CKEDITOR.instances.textForm.setData("");
        $("#commentExit").text("Unselect");
        let range = selectedRange.toCharacterRange(document.getElementById('textSpace'));
        TMP_STATE.quill.enable();
        // CKEDITOR.instances['textForm'].setReadOnly(false);
        $(".commentTypeDropdown").removeAttr("disabled");
        console.log(range);
        hlRange(selectedRange, range);
        if ($("." + escapeSpecialChar(remSpan)).parent().attr("class") != "commented-selection") {
            $("#replies").parent().hide();
            $(".loader").hide();
            displayCommentBox(evt, selectedType);
        }
    }
}

function unhighlight() {
    remSpan = "hl_" + TMP_STATE.current_user.eppn;
    console.log(remSpan);
    var text = $("." + escapeSpecialChar(remSpan)).text();
    $("." + escapeSpecialChar(remSpan)).contents().unwrap();
    return text;
}

function hlRange(selectedRange, range) {
    remSpan = ("hl_" + TMP_STATE.current_user.eppn);
    let applierCount = rangy.createClassApplier(remSpan, {
        useExistingElements: false,
        elementAttributes: {
            "startIndex": range.start,
            "endIndex": range.end,
        }
    });
    console.log("lit", $("#textSpace"));
    applierCount.applyToRange(selectedRange);
    return remSpan;
}

function escapeSpecialChar(id) {
    if (id == null) {
        return null;
    }
    return id.replace(/([\s!"#$%&'()\*+,\.\/:;<=>?@\[\]^`{|}~])/g, "\\$1");
}
