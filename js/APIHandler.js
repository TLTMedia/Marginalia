export class APIHandler {
    constructor({base_url = window.location + 'api/public/'} = {}) {
        this.base_url = base_url;
    }

    request = function({endpoint = 'get_users', method = 'GET', data = '', callback} = {}) {
        let defer = $.Deferred();
        $.ajax({
            url: this.base_url + endpoint,
            method: method,
            data: data,
            dataType: "json"
        }).done(function(data) {
            if (callback) {
                console.log("yes callback");
            } else {
                console.log("no callback");
            }
            defer.resolve(callback(data));
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("Error: " + errorThrown);
        });
        return defer.promise();
    }
}
