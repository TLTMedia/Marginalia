var height;
var remSpan;

// function getFirstRange() {
// //
// //   // let sel = rangy.getSelection();
// //   // return sel.rangeCount ? sel.getRangeAt(0) : null;
// // }

//applies the hl to the area selected by the user
function highlightCurrentSelection(evt) {
  var dfd = new $.Deferred();
  var selectedRange = rangy.getSelection().getRangeAt(0);
  // console.log(rangy.getSelection())
  unhighlight();

  if (selectedRange.endOffset != selectedRange.startOffset) {
    $(".loader").show();
    CKEDITOR.instances.textForm.setData("");
    $("#commentRemove").text("Unselect");
    $("#commentSave").text("Save");
    $("div[aria-describedby='choices']").hide();
    $("[id='ui-id-1']").text("Annotation by: " + currentUser['firstname'] + " " + currentUser['lastname']);
    let remSpan = "commented-selection";


    let range = selectedRange.toCharacterRange(document.getElementById('textSpace'));
    console.log(rangy);
    CKEDITOR.instances['textForm'].setReadOnly(false);
    $(".commentTypeDropdown").removeAttr("disabled")
    $("#commentSave").show();
    $("#commentRemove").show();
    $("#commentExit").hide();
    $("#commentEdit").hide();
    $("div[aria-describedby='comApproval']").hide();

    //hlRange(rangy);
    // let rangeArea = rangy.createRange();
    // rangeArea.selectCharacters(document.getElementById(TEXTSPACE), selectedRange.startOffset, selectedRange.endOffset);
    // let area = rangy.createClassApplier("commented-selection", {
    //     useExistingElements: false,
    //     elementAttributes: {
    //         "creator": $(".chosenUser").text().split(":")[0],
    //         "typeof": "new",
    //     }
    // });
    // area.applyToRange(rangeArea);
    //console.log(range);
    hlRange(selectedRange,range);

    $("div[aria-describedby='replies']").hide();

    $("span[class^='hl']").off().on("click", function(evt) {
      console.log("TESTER1");
      if ($(this).attr("class").substring(0, 3) != "hl_") {
        idName = $(this).attr("class").split("_");
        evt.stopPropagation();

        remSpan = $(evt.currentTarget).attr("class");
      }
    })
    $(".loader").hide();
    displayCommentBox(evt);
  }
  return dfd;
}

function escapeEPPN(eppn) {
  return eppn.replace(/([@\.])/g, "\\\$1");
}

function unhighlight() {
  remSpan = "hl_" + currentUser.eppn.replace(/[@\.]/g, "_");
  $("."+remSpan).contents().unwrap();
}

function hlRange(selectedRange,range) {
  remSpan = "hl_" + currentUser.eppn.replace(/[@\.]/g, "_");
  console.log(selectedRange);
  console.log("start: ",range.start," end: ",range.end);
  let applierCount = rangy.createClassApplier(remSpan, {
    useExistingElements: false,
    elementAttributes: {
        "startIndex": range.start,
        "endIndex": range.end,
    }
  });

  if (literatureText.length == 0) {
    literatureText = $("#textSpace")[0].outerText;
  }

  applierCount.applyToRange(selectedRange);
  return remSpan;
}
