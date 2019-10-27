function makeSelector(selected_eppn, textChosen,data, callback) {
    let buttonTypes = [
        'All',
        'Historical',
        'Analytical',
        'Comment',
        'Definition',
        'Question'
    ];
    makeTypeSelector(buttonTypes);
    makeCommentersSelector(createListOfCommenter(data));
    callback(selected_eppn, textChosen);
    makeSelectorDrawerOpener();
    hideAllSelector();
}

function hideAllSelector() {
    $(".allTypes").hide();
    $(".allCommenters").hide();
}

function makeSelectorDrawerOpener() {
    if ($(".selectorOpener").length == 0) {
        let selectorOpener = $('<button/>', {
            class: "selectorOpener"
        });
        $(selectorOpener).on("click", () => {
            if ($("#typeSelector").find("ul").is(":visible") && $("#commenterSelector").find("ul").is(":visible")) {
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
    let selectorHeader = $('<li>', {
        class: "selectorHeader",
        text: "Filter By:"
    });
    $(allTypes).append(selectorHeader);
    buttonTypes.forEach(function (type) {
        let list = makeSelectorOptions(type, 'typeSelector');
        $(allTypes).append(list);
    });
    $('#typeSelector').append(allTypes);
    $("#buttonAll").addClass("is-checked");
}

function makeCommentersSelector(commenters) {
    $("#commenterSelector").empty();
    commenters.unshift("AllCommenters");
    let allCommenters = $('<ul/>', {
        class: "allCommenters"
    });
    let selectorHeader = $('<li>', {
        class: "selectorHeader"
    });
    let searchCommenters = $('<input>', {
        type: "text",
        class: "commenterSelectorSearch",
        placeholder: "Filter By Name..."
    });
    $(selectorHeader).append(searchCommenters);
    $(allCommenters).append(selectorHeader);
    commenters.forEach((data) => {
        let list = makeSelectorOptions(data, 'commenterSelector');
        $(allCommenters).append(list);
    });
    $('#commenterSelector').append(allCommenters);
    $("#buttonAllCommenters").addClass("is-checked");

    //search bar for commenters
    $(".commenterSelectorSearch").on("keyup", () => {
        let ul = $(".allCommenters");
        let input = $(".commenterSelectorSearch");
        searchAction(input, ul, "user");
    });
}

function makeSelectorOptions(option, mode) {
    let data = option;
    let name;
    let text;
    if (mode == 'commenterSelector') {
        name = 'commenterSelector';
        text = data.split("@")[0];
    }
    else if (mode == 'typeSelector') {
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
    input.on("click", (evt) => {
        let currentSelectedType;
        let currentSelectedCommenter;
        if (evt["currentTarget"]["attributes"]["name"]["value"] == 'commenterSelector') {
            currentSelectedType = $("#typeSelector").attr("currentTarget") ?  $("#typeSelector").attr('currentTarget') : 'All';
            console.log(currentSelectedType)
            currentSelectedCommenter = evt["currentTarget"]["id"];
            $("#commenterSelector").attr('currentTarget', currentSelectedCommenter);
        }
        else if (evt["currentTarget"]["attributes"]["name"]["value"] == 'typeSelector') {
            currentSelectedType = evt["currentTarget"]["id"];
            currentSelectedCommenter = $("#commenterSelector").attr('currentTarget') ? $("#commenterSelector").attr('currentTarget') : 'AllCommenters';
            $("#typeSelector").attr('currentTarget', currentSelectedType);
        }
        selectorOnSelect(currentSelectedType, currentSelectedCommenter);
    });
    componentHandler.upgradeElement($(radioLabel)[0]);
    return list;
}

//TODO need the author and the work name to enable the click event for the comments
//TODO use a better way to store the work and author instead of getting it from DOM
function selectorOnSelect(currentSelectedType, currentSelectedCommenter) {
    unwrapEveryComments();
    let currentWork = $("#setting").attr("work");
    let currentCreator = $("#setting").attr("author");
    loadUserComments(currentCreator, currentWork, currentSelectedType, currentSelectedCommenter);
    handleStartEndDiv(createCommentData());
    allowClickOnComment($("#setting").attr("work"), $("#setting").attr("author"));
}

function unwrapEveryComments() {
    let comments = $(".commented-selection");
    let startDivs = $(".startDiv");
    let endDivs = $(".endDiv");
    comments.contents().unwrap();
    startDivs.remove();
    endDivs.remove();
}

function colorNotUsedTypeSelector(selected_eppn,textChosen) {
    API.request({
        endpoint: "get_highlights",
        data: {
          creator: selected_eppn,
          work: textChosen
        }
    }).then((data) => {
      console.log(data)
        let key = ["Historical", "Analytical", "Comment", "Definition", "Question"];
        let buttonTypes = {
            "Historical": 0,
            "Analytical": 0,
            "Comment": 0,
            "Definition": 0,
            "Question": 0
        };
        for (var i = 0; i < data.length; i++) {
            let type = data[i]["commentType"];
            buttonTypes[type] += 1;
        }
        key.forEach((element) => {
            if (buttonTypes[element] == 0) {
                $("#button" + element).addClass("notUsedType");
            }
            else {
                $("#button" + element).removeClass("notUsedType");
            }
        });
    });
}

function updateCommenterSelectors() {
    var newCommenters = [];
    var comments = $("#textSpace").find('span');
    for (var i = 0; i < comments.length; i++) {
        //check if this is the commentSpan or not (only commentSpan has a creator attribute)
        if (comments[i]['attributes']['creator']) {
            var commenter = comments[i]['attributes']['creator']['value'];
            var isCommenterExist = false;
            for (var j = 0; j < newCommenters.length; j++) {
                if (commenter == newCommenters[j]) {
                    isCommenterExist = true;
                }
            }
            if (!isCommenterExist) {
                newCommenters.push(commenter);
            }
        }
    }
    makeCommentersSelector(newCommenters);
    if (!$("#typeSelector").find("ul").is(":visible")) {
        hideAllSelector();
    }
}
