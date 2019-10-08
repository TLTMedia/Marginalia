function makeSelector(commenters,callback){
  let buttonTypes = [
    'All',
    'Historical',
    'Analytical',
    'Comment',
    'Definition',
    'Question'
  ];
  makeTypeSelector(buttonTypes);
  makeCommentersSelector(commenters);
  callback();
  makeSelectorDrawerOpener();
  hideAllSelector();
}

function hideAllSelector(){
  $(".allTypes").hide();
  $(".allCommenters").hide();
}

function makeSelectorDrawerOpener() {
  if ($(".selectorOpener").length == 0) {
    let selectorOpener = $('<button/>', {
      class: "selectorOpener"
    });

    $(selectorOpener).on("click", () => {
      if($("#typeSelector").find("ul").is(":visible") && $("#commenterSelector").find("ul").is(":visible")){
        $("#typeSelector").find("ul").hide();
        $("#commenterSelector").find("ul").hide();
        $(selectorOpener).css({
          "margin-right": "0px"
        });
        $(selectorOpener).text("Show filters");
      } else {
        $("#typeSelector").find("ul").show();
        $("#commenterSelector").find("ul").show();
        $(selectorOpener).css({
          "margin-right": "176px"
        });
        $(selectorOpener).text("Hide filters");
      }
    });

    $(".selector").append(selectorOpener);
  } else {
    $(".selectorOpener").css({
      "margin-right": "0px"
    });
  }

  $(".selectorOpener").text("Show filters");
}

function makeTypeSelector(buttonTypes) {
  $("#typeSelector").empty();
  let allTypes = $('<ul/>', {
    class: "allTypes"
  });
  let selectorHeader = $('<li>',{
    class: "selectorHeader",
    text: "Filter By:"
  });
  $(allTypes).append(selectorHeader);
  buttonTypes.forEach(function(type) {
    let list = makeSelectorOptions(type,'typeSelector');
    $(allTypes).append(list);
  });
  $('#typeSelector').append(allTypes);
  $("#All").click();
}

function makeCommentersSelector(commenters){
  $("#commenterSelector").empty();
  commenters.unshift("AllCommenters");
  let allCommenters = $('<ul/>', {
    class: "allCommenters"
  });
  let selectorHeader = $('<li>',{
    class: "selectorHeader"
  });
  let searchCommenters = $('<input>',{
    type: "text",
    class: "commenterSelectorSearch",
    placeholder: "Filter By Name..."
  });
  $(selectorHeader).append(searchCommenters);
  $(allCommenters).append(selectorHeader);
  commenters.forEach((data)=>{
    let list = makeSelectorOptions(data,'commenterSelector');
    $(allCommenters).append(list);
  });
  $('#commenterSelector').append(allCommenters);
  $("#AllCommenters").click();

  //search bar for commenters
  $(".commenterSelectorSearch").on("keyup",()=>{
    let ul = $(".allCommenters");
    let input = $(".commenterSelectorSearch");
    searchAction(input,ul,"user");
  });
}

function makeSelectorOptions(option,mode){
  let data = option;
  let name;
  let text;
  if(mode == 'commenterSelector'){
    name = 'commenterSelector';
    text = data.split("@")[0];
  }
  else if (mode == 'typeSelector'){
    name = 'typeSelector';
    text = data;
  }

  let list = $('<li/>', {
    class: "buttons"
  });

  let radioLabel = $("<label>", {
    class: "mdl-radio mdl-js-radio",
    id: "button" + data,
    for: data
  });

  let input = $('<input/>', {
    type: "radio",
    id: data,
    name: name,
    class: "mdl-radio__button",
  });

  let spanText = $("<span>", {
    class: "mdl-radio__label",
    text: text
  });

  $(list).append(radioLabel);
  $(radioLabel).append(input, spanText);
  input.on("click", (evt)=>{
    let currentSelectedType;
    let currentSelectedCommenter;
    if(evt["currentTarget"]["attributes"]["name"]["value"] == 'commenterSelector'){
      currentSelectedType = $("#typeSelector").attr("currentTarget");
      currentSelectedCommenter = evt["currentTarget"]["id"];
      $("#commenterSelector").attr('currentTarget',currentSelectedCommenter);
    }
    else if(evt["currentTarget"]["attributes"]["name"]["value"] == 'typeSelector'){
      currentSelectedType = evt["currentTarget"]["id"];
      currentSelectedCommenter = $("#commenterSelector").attr('currentTarget') ? $("#commenterSelector").attr('currentTarget') : 'AllCommenters';
      $("#typeSelector").attr('currentTarget',currentSelectedType);
    }
    selectorOnSelect(currentSelectedType, currentSelectedCommenter);
  });
  componentHandler.upgradeElement($(radioLabel)[0]);
  return list;
}

//TODO need the author and the work name to enable the click event for the comments
//TODO use a better way to store the work and author instead of getting it from DOM
function selectorOnSelect(currentSelectedType, currentSelectedCommenter){
  let selectedComments;
  $(".hiddenComments").addClass("commented-selection");
  $(".commented-selection").off().addClass("hiddenComments").removeClass("blueComments");
  $(".startDiv").attr("isBlue",false);
  $(".endDiv").attr("isBlue",false);
  //change back the temp comments to the original comments
  recoverTempSpanComments();
  if (currentSelectedType == "All" && currentSelectedCommenter == "AllCommenters"){
    //selectedComments = $(".commented-selection").css({"background-color": "rgba(100, 255, 100, 1.0)"});
    selectedComments = $(".commented-selection").removeClass("hiddenComments");
  }
  else if(currentSelectedCommenter == "AllCommenters"){
    //selectedComments = $(".commented-selection" + "[typeof='" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
    selectedComments = $(".commented-selection" + "[typeof='" + currentSelectedType + "']").removeClass("hiddenComments");
  }
  else if(currentSelectedType == "All"){
    //selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
    selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "']").removeClass("hiddenComments");
  }
  else{
    //selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "'][typeof = '" + currentSelectedType + "']").css({"background-color": "rgba(100, 255, 100, 1.0)"});
    selectedComments = $(".commented-selection" + "[creator ='" + currentSelectedCommenter + "'][typeof = '" + currentSelectedType + "']").removeClass("hiddenComments");
  }
  $(".commented-selection.hiddenComments").removeClass("commented-selection blueComments");
  //markUnapprovedComments(currentSelectedType,currentSelectedCommenter);
  handleHiddenCommentsWithParent();
  let commentData = createCommentData();
  handleStartEndDiv(commentData);
  allowClickOnComment($("#setting").attr("work"),$("#setting").attr("author"));
}
//change the temp comments back to original comment
function recoverTempSpanComments(){
  //set the tempComments back to the original comment
  let tempComments = $(".temp.commented-selection");
  tempComments.each(function(){
    var tempSpan = $(this);
    let oldId = tempSpan.attr("oldId");
    let oldCreator = tempSpan.attr("oldCreator");
    if(tempSpan.attr("isUnapproved") == "true"){
      tempSpan.addClass("unapprovedComments");
    }
    else if (tempSpan.attr("isThreadNotApproved") == "true"){
      tempSpan.addClass("threadNotApproved");
    }
    tempSpan.attr({"commentId":oldId,"creator":oldCreator}).removeAttr("oldId oldCreator isUnapproved isThreadNotApproved").removeClass("temp");
  });
}
//fill in the comments that has a gap from a overlap comment
function handleHiddenCommentsWithParent(){
  let hiddenComments = $(".hiddenComments");
  for(let i = 0 ; i < hiddenComments.length ; i++){
    let id = hiddenComments[i]["attributes"]["commentId"]["value"];
    let startDiv = $(".startDiv" + "[commentId = '"+id+"']");
    let parentHash = startDiv.attr("parentHash");
    if(parentHash != undefined){
      let parent = $(".commented-selection" + "[commentId = '"+parentHash+"']");
      if(parent.length != 0){
        let parentStart = $(".startDiv" + "[commentId = '"+parentHash+"']");
        let parentEnd = $(".endDiv" + "[commentId = '"+parentHash+"']");
        let parentCreator = parent.attr("creator");
        console.log(parentStart.nextUntil('.endDiv'+"[commentId = '"+parentHash+"']",'span'));
        let spansBetween = parentStart.nextUntil('.endDiv'+"[commentId = '"+parentHash+"']",'span');
        spansBetween.addClass('temp commented-selection').removeClass("hiddenComments");
        spansBetween.each(function(){
          var span = $(this);
          if(span.hasClass("unapprovedComments")){
            span.attr("isUnapproved",true);
            span.removeClass("unapprovedComments");
          }
          else if (span.hasClass("threadNotApproved")){
            span.attr("isThreadNotApproved",true);
            span.removeClass("threadNotApproved");
          }
          let oldId = span.attr("commentId");
          let oldCreator = span.attr("creator");
          span.attr({"oldCreator":oldCreator, "oldId":oldId, "commentId":parentHash, "creator":parentCreator});
        });
      }
    }
  }
}

function colorNotUsedTypeSelector(){
  var comments = $("#text").find(".commented-selection, .hiddenComments");
  let key = ["Historical","Analytical","Comment","Definition","Question"];
  let buttonTypes = {
    "Historical":0,
    "Analytical":0,
    "Comment":0,
    "Definition":0,
    "Question":0
  };
  for(var i = 0;i < comments.length; i++){
    let type = comments[i]["attributes"]["typeof"]["value"];
    buttonTypes[type] +=1;
  }
  key.forEach((element)=>{
    if(buttonTypes[element]==0){
      $("#button"+element).addClass("notUsedType");
    }
    else{
      $("#button"+element).removeClass("notUsedType");
    }
  });
}

function updateCommenterSelectors(){
  var newCommenters = [];
  var comments = $("#textSpace").find('span');
  for(var i = 0 ; i < comments.length ; i++){
    //check if this is the commentSpan or not (only commentSpan has a creator attribute)
    if(comments[i]['attributes']['creator']){
      var commenter = comments[i]['attributes']['creator']['value'];
      var isCommenterExist = false;
      for(var j = 0 ; j < newCommenters.length ; j++){
        if(commenter == newCommenters[j]){
          isCommenterExist = true;
        }
      }
      if(!isCommenterExist){
        newCommenters.push(commenter);
      }
    }
  }
  makeCommentersSelector(newCommenters);
  if(!$("#typeSelector").find("ul").is(":visible")){
    hideAllSelector();
  }
}

// hash is not needed if the comment is deleted
function updateTypeSelector(hash, type){
  // var currentSelectedType = $("#typeSelector").attr("currentTarget");
  // var currentSelectedCommenter = $("#commenterSelector").attr("currentTarget");
  // //reselect the type selector
  // $("#button"+currentSelectedType).removeClass("is-checked");
  // $("#button"+type).addClass("is-checked");
  // $("#typeSelector").attr("currentTarget",type);
  // selectorOnSelect("All",currentSelectedCommenter);
  // //update the notUsedType
  colorNotUsedTypeSelector();
}
