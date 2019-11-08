export class Toast {
    /**
     * TODO: This is temporarily just a wrapper around Toast notifications...
     */
    constructor() {
        console.log("Toast Module Loaded");
    }

    /**
     * Can be type: [info, error, warning, success]
     */
    create_toast(message, type = "info") {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": false,
            "progressBar": false,
            "positionClass": "toast-bottom-center",
            // "preventDuplicates": true,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "4000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        toastr[type](message);
    }
}
