let getUserData = () => {
    $.getJSON("api/public/get_current_user", function(data) {
        if (data['status'] != 'ok') {
            alert("Unable to retrieve user listing");
        } else {
            currentUser = data['data'];
        }
    });
};
