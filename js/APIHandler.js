export class APIHandler {
    constructor({base_url = window.location + 'api/public/'} = {}) {
        this.base_url = base_url;
    }

    request = ({endpoint = 'get_creators', method = 'GET', data = '', callback} = {}) => {
        let defer = $.Deferred();
        $.ajax({
            url: this.base_url + endpoint + '?modular',
            method: method,
            data: data,
            dataType: 'json',
            async: false,
            cache: false,
            contentType: false,
            processData: false
        }).done(function(data) {
            if (data['status'] == 'error') {
                console.debug(data);
                alert(data['message']);
                return;
            } else if (data['status'] !== 'ok') {
                console.log(data);
                return;
            } else {
                if (callback) {
                    defer.resolve(callback(data['data']));
                } else {
                    defer.resolve(data['data']);
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("Error: " + errorThrown);
        });
        return defer.promise();
    }
}
