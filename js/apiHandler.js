function apiRequest(endpoint = 'get_users', method = 'GET', data = '') {
    const baseUrl = window.location + "api/public/";
    $.ajax({
        url: baseUrl + endpoint,
        method: method,
        data: data,
        dataType: "json"
    }).done(function(data) {
        return data;
    }).fail(function(jqXHR, textStatus, errorThrown) {
        alert("Error: " + errorThrown);
    });
}
