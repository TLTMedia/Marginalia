export class SettingsController {
    constructor({ state = state, ui = ui }) {
        console.log("InterfaceController/SettingsController Module Loaded");

        this.state = state;
        this.ui = ui;
    }

    create_data_table_header() {
        let thead_tr = $("<tr/>");
        let nameTableHead = $("<th/>", {
            class: "mdl-data-table__cell--non-numeric",
            text: "Name/Type"
        });

        thead_tr.append(nameTableHead);

        let dataTableHead = ["All Comments", "Unapproved Comments"];
        for (let i in dataTableHead) {
            let header = $("<th/>", {
                text: dataTableHead[i]
            });

            thead_tr.append(header);
        }

        $("#settingDataTable").find("thead").append(thead_tr);

        componentHandler.upgradeAllRegistered();
    }

    async create_data_table_body() {
        let typeData = ["All", "Historical", "Analytical", "Comment", "Question"];
        for (let i in typeData) {
            let tr = $("<tr/>");

            let type = $("<td/>", {
                class: "mdl-data-table__cell--non-numeric",
                text: typeData[i],
            });
            tr.append(type);

            let data = [
                this.parse_comments_data(
                    typeData[i],
                    undefined,
                    true
                ),
                this.parse_comments_data(
                    typeData[i],
                    undefined,
                    false
                ),
            ];
            for (let j in data) {
                let num = $("<td/>");
                num.html(data[j]);
                tr.append(num)
            }

            $("#settingDataTable").find("tbody").append(tr);
        }

        let highlight_data = await this.state.api_data.comments_data.get_work_highlights();
        let commenter = this.create_list_of_commenters(highlight_data);
        for (let i in commenter) {
            let tr = $("<tr/>");
            let name = $("<td/>", {
                class: "mdl-data-table__cell--non-numeric",
                text: commenter[i]
            });
            tr.append(name);

            let par_data = [
                this.parse_comments_data(
                    undefined,
                    commenter[i],
                    true
                ),
                this.parse_comments_data(
                    undefined,
                    commenter[i],
                    false
                ),
            ];
            for (let j in par_data) {
                let num = $("<td/>");
                num.html(par_data[j]);
                tr.append(num);
            }

            $("#settingDataTable").find("tbody").append(tr);
        }

        componentHandler.upgradeAllRegistered();
    }

    // private helper
    create_list_of_commenters(data) {
        const commenters = [];
        if (data.length) {
            commenters.push(data[0].eppn);
            for (let i = 1; i < data.length; i++) {
                let eppn = data[i].eppn;
                let eppnExist = false;
                for (let j = 0; j < commenters.length; j++) {
                    if (commenters[j] == eppn) {
                        eppnExist = true;
                    }
                }

                if (!eppnExist) {
                    commenters.push(eppn);
                }
            }
        }

        return commenters;
    }

    // private helper
    parse_comments_data(type, commenter, all) {
        let className;
        let data;
        if (all) {
            className = ".commented-selection";
        } else {
            className = ".unapprovedComments";
        }

        if (type != undefined) {
            if (type == "All") {
                data = $(className);
            } else {
                data = $(className + "[typeOf = '" + type + "']");
            }
        } else if (commenter != undefined) {
            data = $(className + "[creator = '" + commenter + "']");
        }

        return data.length;
    }
}
