function colorNotUsedTypeSelector(selected_eppn, textChosen) {
    API.request({
        endpoint: "get_highlights",
        data: {
            creator: selected_eppn,
            work: textChosen
        }
    }).then(data => {
        let key = ["Historical", "Analytical", "Comment", "Definition", "Question"];
        let buttonTypes = {
            "Historical": 0,
            "Analytical": 0,
            "Comment": 0,
            "Definition": 0,
            "Question": 0
        };

        for (let i = 0; i < data.length; i++) {
            let type = data[i]["commentType"];
            buttonTypes[type] += 1;
        }

        key.forEach((element) => {
            if (buttonTypes[element] == 0) {
                $("#button" + element).addClass("notUsedType");
            } else {
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
}
