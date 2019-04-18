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

  if (selectedRange.endOffset != selectedRange.startOffset) {
    $(".loader").show();
    CKEDITOR.instances.textForm.setData("");
    $("#commentRemove").text("Unselect");
    $("#commentSave").text("Save");
    $("div[aria-describedby='choices']").hide();
    $("[id='ui-id-1']").text("Annotation by: " + currentUser['firstname'] + " " + currentUser['lastname']);
    let remSpan = "commented-selection";

    let range = selectedRange.toCharacterRange(document.getElementById('textSpace'));
    console.log(rangy)
    CKEDITOR.instances['textForm'].setReadOnly(false);
    $(".commentTypeDropdown").removeAttr("disabled")
    $("#commentSave").show();
    $("#commentRemove").show();
    $("#commentExit").hide();
    $("#commentEdit").hide();
    $("div[aria-describedby='comApproval']").hide();

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


    $("." + remSpan).attr("startIndex", range.start);
    $("." + remSpan).attr("endIndex", range.end);
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

function unhighlight(hl_ID) {
  let applierCount = rangy.createClassApplier(hl_ID);
  //console.log(applierCount);
  let range = rangy.createRange();

  range.selectNodeContents(document.getElementById("text"));
  applierCount.undoToRange(range);
}

function hlRange(range) {
  remSpan = "hl_" + currentUser.netid;

  let applierCount = rangy.createClassApplier(remSpan, {
    useExistingElements: false
  });

  if (literatureText.length == 0) {
    literatureText = $("#textSpace")[0].outerText;
    //  console.log(literatureText);
  }
  applierCount.applyToRange(range);
  //console.log(range);
  //linkComments(id);
}
