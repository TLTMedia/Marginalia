// function colorNotUsedTypeSelector(selected_eppn, textChosen) {
//     console.log("call this shit")
//     API.request({
//         endpoint: "get_highlights",
//         data: {
//             creator: selected_eppn,
//             work: textChosen
//         }
//     }).then(data => {
//         console.log(data);
//         let key = ["Historical", "Analytical", "Comment", "Definition", "Question"];
//         let buttonTypes = {
//             "Historical": 0,
//             "Analytical": 0,
//             "Comment": 0,
//             "Definition": 0,
//             "Question": 0
//         };
//
//         for (let i = 0; i < data.length; i++) {
//             let type = data[i]["commentType"];
//             buttonTypes[type] += 1;
//         }
//
//         key.forEach((element) => {
//             if (buttonTypes[element] == 0) {
//                 $("#button" + element).addClass("notUsedType");
//             } else {
//                 $("#button" + element).removeClass("notUsedType");
//             }
//         });
//     });
// }

// work_comment_data is the return value of the get_highlight function
// commenter is the current selected commenter
function colorNotUsedTypeSelector(work_comment_data){
    console.log(work_comment_data);
    //TODO HARD CODED FOR STONYBROOK STUDENT
    let commenter = TMP_STATE.filters.selected_author_filter + "@stonybrook.edu";
    let key = ["Historical", "Analytical", "Comment", "Definition", "Question"];
    let buttonTypes = {
        "Historical": 0,
        "Analytical": 0,
        "Comment": 0,
        "Definition": 0,
        "Question": 0
    };

    for (let i = 0; i < work_comment_data.length; i++) {
        let type = work_comment_data[i]["commentType"];
        if(commenter != "show-all-eppn"){
            let data_commenter = work_comment_data[i]["eppn"];
            if(commenter == data_commenter){
                buttonTypes[type] += 1;
            }
        }
        else{
            buttonTypes[type] += 1;
        }

    }
    console.log(buttonTypes)
    key.forEach((element) => {
        $("#filter-"+ element.toLowerCase()).removeAttr("disabled");
        if (buttonTypes[element] == 0) {
            console.log("#filter-", element.toLowerCase());
            $("#filter-"+ element.toLowerCase()).attr("disabled","disabled");
        }
    });
}

// function updateCommenterSelectors() {
//     var newCommenters = [];
//     var comments = $("#textSpace").find('span');
//     for (var i = 0; i < comments.length; i++) {
//         //check if this is the commentSpan or not (only commentSpan has a creator attribute)
//         if (comments[i]['attributes']['creator']) {
//             var commenter = comments[i]['attributes']['creator']['value'];
//             var isCommenterExist = false;
//             for (var j = 0; j < newCommenters.length; j++) {
//                 if (commenter == newCommenters[j]) {
//                     isCommenterExist = true;
//                 }
//             }
//             if (!isCommenterExist) {
//                 newCommenters.push(commenter);
//             }
//         }
//     }
// }
