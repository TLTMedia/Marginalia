export class APIHandler {
    constructor({ base_url = location.pathname + 'api/public/' } = {}) {
        console.log("APIHandler Module Loaded");

        this.base_url = base_url;
    }

    parseGetData(data) {
        let res = "";
        for (let key in data) {
            res += "&" + key + "=" + data[key];
        }
        return res;
    }

    request({ endpoint = 'get_creators', method = 'GET', data = '', dataType = 'object', callback } = {}) {
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
            async: false,
            cache: false,
            contentType: false,
            processData: false
        })
            .done(data => {
                if (data['status'] == 'error') {
                    console.log("ERROR", data);
                    launchToastNotifcation(data.message);
                    return;
                } else if (data['status'] !== 'ok') {
                    console.log("NOK", data);
                    return;
                } else {
                    // TODO add additional part
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
            })
            .fail((_, __, errorThrown) => {
                alert("An unexpected error occured. Please try again.");
                console.log("ERROR", errorThrown);
            });
        return defer.promise();
    }
}
