export class APIHandler {
    constructor() {
        console.log("APIHandler Module Loaded");

        console.log(window.location.hostname);
        this.base_url = "https://" + window.location.hostname + "/marginalia/api/public/";
    }

    parseGetData(data) {
        let res = "";
        for (let key in data) {
            res += "&" + key + "=" + data[key];
        }

        return res;
    }

    request({ endpoint = 'get_creators', method = 'GET', data = '', response_type = 'parsed', dataType = 'object', callback }) {
        let getData = '';
        if (method == 'GET') {
            getData = this.parseGetData(data);
            data = '';
        } else if (method == 'POST' && dataType == 'object') {
            data = JSON.stringify(data);
        } else if (method == 'POST' && dataType == 'form') {
            // do nothing with the data
        }

        let defer = $.Deferred();

        $.ajax({
            url: this.base_url + endpoint + '?modular=true' + getData,
            method: method,
            data: data,
            dataType: 'json',
            cache: false,
            contentType: false,
            processData: false,
        }).done(data => {
            if (response_type == "raw") {
                return defer.resolve(data);
            } else if (response_type == "parsed") {
                if (data['status'] == 'error') {
                    console.log("ERROR", data);

                    launchToastNotifcation(data.message);

                    return;
                } else if (data['status'] !== 'ok') {
                    console.log("NOK", data);

                    return;
                } else {
                    // TODO: add additional part
                    let returnMessages = {
                        data: data['data'],
                        message: data['message'],
                        commentHash: data['commentHash'],
                        privacy: data['privacy'],
                        approval: data['approval']
                    };

                    if (callback) {
                        if (data['commentHash'] == undefined) {
                            defer.resolve(callback(data['data'] || data['message']));
                        } else {
                            defer.resolve(callback(returnMessages));
                        }
                    } else {
                        if (data['commentHash'] == undefined &&
                            data['additional'] == undefined) {
                            defer.resolve(data['data'] || data['message']);
                        } else {
                            defer.resolve(returnMessages);
                        }
                    }
                }
            } else {
                console.error("invalid requested response type");
            }
        }).fail((_, __, errorThrown) => {
            alert("An unexpected error occured. Please try again.");

            console.log("ERROR", errorThrown);
        });

        return defer.promise();
    }
}
