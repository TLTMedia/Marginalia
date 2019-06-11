var height;
var remSpan;

// function getFirstRange() {
// //
// //   // let sel = rangy.getSelection();
// //   // return sel.rangeCount ? sel.getRangeAt(0) : null;
// // }

//applies the hl to the area selected by the user
function highlightCurrentSelection(evt) {

  var selectedRange = rangy.getSelection().getRangeAt(0);
  $("#commentBox").removeAttr("data-replyToEppn");
  $("#commentBox").removeAttr("data-replyToHash");
  if (selectedRange.endOffset != selectedRange.startOffset) {
    unhighlight();
    $(".loader").show();
    CKEDITOR.instances.textForm.setData("");
    $("#commentExit").text("Unselect");
    let range = selectedRange.toCharacterRange(document.getElementById('textSpace'));
    CKEDITOR.instances['textForm'].setReadOnly(false);
    $(".commentTypeDropdown").removeAttr("disabled")
    hlRange(selectedRange,range);
    if($("."+escapeSpecialChar(remSpan)).parent().attr("class") != "commented-selection"){
      $("#replies").parent().hide();
      $(".loader").hide();
      displayCommentBox(evt);
    }
  }
}

function unhighlight(){
  remSpan ="hl_" + currentUser.eppn;
  console.log(remSpan);
  var text = $("."+escapeSpecialChar(remSpan)).text();
  $("."+escapeSpecialChar(remSpan)).contents().unwrap();
  return text;
}

function hlRange(selectedRange,range) {
  remSpan = ("hl_" + currentUser.eppn);
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

function escapeSpecialChar(id){
  if(id == null){
    return null;
  }
  return id.replace(/([\s!"#$%&'()\*+,\.\/:;<=>?@\[\]^`{|}~])/g, "\\$1");
}
