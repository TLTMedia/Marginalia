export class APIHandler {
    constructor({base_url = location.pathname + 'api/public/'} = {}) {
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
        }).done((data) => {
            if (data['status'] == 'error') {
                console.log("ERROR", data);
                alert(data['message']);
                return;
            } else if (data['status'] !== 'ok') {
                console.log("NOK", data);
                return;
            } else {
              //TODO add additional part
              var returnMessages = {
                data: data['data'],
                message: data['message'],
                commentHash: data['commentHash'],
                additional: data['additional']
              }
                if (callback) {
                    if( data['commentHash'] == undefined){
                        defer.resolve(callback(data['data'] || data['message']));
                    }
                    else{
                        defer.resolve(callback(returnMessages));
                    }
                }
                else {
                    if( data['commentHash'] == undefined && data['additional'] == undefined){
                      defer.resolve(data['data'] || data['message']);
                    }
                    else{
                      defer.resolve(returnMessages);
                    }
                }
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            alert("An unexpected error occured. Please try again.");
            console.log("ERROR", errorThrown);
        });
        return defer.promise();
    }
}
