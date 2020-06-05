export class APIHandler {
    constructor({ toast = toast }) {
        console.log("APIHandler Module Loaded");

        this.base_url =
            "//" +
            window.location.hostname +
            "/marginalia/api/public/index.php/";
        this.toast = toast;
    }

    parseGetData(data) {
        let res = "";
        for (let key in data) {
            res += "&" + key + "=" + data[key];
        }

        return res;
    }

    request({
        endpoint = "get_creators",
        method = "GET",
        data = "",
        response_type = "parsed",
        dataType = "object",
        callback,
    }) {
        let getData = "";
        if (method == "GET") {
            getData = this.parseGetData(data);
            data = "";
        } else if (method == "POST" && dataType == "object") {
            data = JSON.stringify(data);
        } else if (method == "POST" && dataType == "form") {
            // do nothing with the data
        }

        let defer = $.Deferred();

        $.ajax({
            url: this.base_url + endpoint + "?modular=true" + getData,
            method: method,
            data: data,
            dataType: "json",
            cache: false,
            contentType: false,
            processData: false,
        })
            .done((data) => {
                if (response_type == "raw") {
                    return defer.resolve(data);
                } else if (response_type == "parsed") {
                    if (data["status"] == "error") {
                        console.warn(
                            "Warning: api response returned with status of error - returning whole object",
                            data
                        );

                        // toast of what the error was
                        this.toast.api_toast(data);

                        return;
                    } else if (data["status"] !== "ok") {
                        console.error(
                            'Error: api response returned with a status of neither "error" nor "ok"',
                            data
                        );

                        return;
                    } else {
                        // TODO: add additional part
                        let returnMessages = {
                            data: data["data"],
                            message: data["message"],
                            commentHash: data["commentHash"],
                            privacy: data["privacy"],
                            approval: data["approval"],
                        };

                        if (callback) {
                            if (data["commentHash"] == undefined) {
                                defer.resolve(
                                    callback(data["data"] || data["message"])
                                );
                            } else {
                                defer.resolve(callback(returnMessages));
                            }
                        } else {
                            if (
                                data["commentHash"] == undefined &&
                                data["additional"] == undefined
                            ) {
                                defer.resolve(data["data"] || data["message"]);
                            } else {
                                defer.resolve(returnMessages);
                            }
                        }
                    }
                } else {
                    console.error("invalid requested response type");
                }
            })
            .fail((_, __, errorThrown) => {
                alert("An unexpected error occured. Please try again.");

                console.error("Error:", errorThrown);
            });

        return defer.promise();
    }
}
