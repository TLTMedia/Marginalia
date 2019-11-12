function createDataTableHeader() {
    let thead_tr = $("<tr/>");
    let nameTableHead = $("<th/>", {
        class: "mdl-data-table__cell--non-numeric",
        text: "Name/Type"
    });

    thead_tr.append(nameTableHead);

    let dataTableHead = ["All Comments", "Unapproved Comments"];
    for (var i in dataTableHead) {
        let header = $("<th/>", {
            text: dataTableHead[i]
        });
        thead_tr.append(header);
    }

    $("#settingDataTable").find("thead").append(thead_tr);

    componentHandler.upgradeAllRegistered();
}

function createDataTableBody(selected_eppn, litId) {
    let typeData = ["All", "Historical", "Analytical", "Comment", "Question"];
    for (var i in typeData) {
        let tr = $("<tr/>");
        let data = [getWorkCommentsData(typeData[i], undefined, true), getWorkCommentsData(typeData[i], undefined, false)]
        let type = $("<td/>", {
            class: "mdl-data-table__cell--non-numeric",
            text: typeData[i]
        });
        tr.append(type);
        for (var j in data) {
            let num = $("<td/>");
            num.html(data[j]);
            tr.append(num)
        }
        $("#settingDataTable").find("tbody").append(tr);
    }
    API.request({
        endpoint: "get_highlights",
        method: "GET",
        data: {
            creator: selected_eppn,
            work: litId
        }
    }).then((data) => {
        let commenter = createListOfCommenter(data);
        for (var i in commenter) {
            let tr = $("<tr/>");
            let name = $("<td/>", {
                class: "mdl-data-table__cell--non-numeric",
                text: commenter[i]
            });
            tr.append(name);
            let data = [getWorkCommentsData(undefined, commenter[i], true), getWorkCommentsData(undefined, commenter[i], false)];
            for (var j in data) {
                let num = $("<td/>");
                num.html(data[j]);
                tr.append(num);
            }
            $("#settingDataTable").find("tbody").append(tr);
        }
    });
    componentHandler.upgradeAllRegistered();
}

function getWorkCommentsData(type, commenter, all) {
    let className;
    let data;
    if (all) {
        className = ".commented-selection"
    }
    else {
        className = ".unapprovedComments"
    }
    if (type != undefined) {
        if (type == "All") {
            data = $(className);
        }
        else {
            data = $(className + "[typeOf = '" + type + "']");
        }
    }
    else if (commenter != undefined) {
        data = $(className + "[creator = '" + commenter + "']");
    }
    return data.length
}
