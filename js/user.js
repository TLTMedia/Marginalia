let getUserData = () => {
    let dfd = $.Deferred();
    $.getJSON("api/public/get_current_user", function(data) {
        if (data['status'] != 'ok') {
            alert("Unable to retrieve user listing");
        } else {
            dfd.resolve(data['data']);
        }
    });
    return dfd.promise();
};
