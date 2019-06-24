var height;
var remSpan;


//applies the hl to the area selected by the user
function highlightCurrentSelection(evt,literatureText) {

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
    hlRange(selectedRange,range,literatureText);
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

function hlRange(selectedRange,range,literatureText) {
  remSpan = ("hl_" + currentUser.eppn);
  let applierCount = rangy.createClassApplier(remSpan, {
    useExistingElements: false,
    elementAttributes: {
        "startIndex": range.start,
        "endIndex": range.end,
    }
  });
  console.log("lit",$("#textSpace"));
  applierCount.applyToRange(selectedRange);
  return remSpan;
}

function escapeSpecialChar(id){
  if(id == null){
    return null;
  }
  return id.replace(/([\s!"#$%&'()\*+,\.\/:;<=>?@\[\]^`{|}~])/g, "\\$1");
}
