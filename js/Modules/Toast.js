export class Toast {
    /**
     * TODO: This is temporarily just a wrapper around Toast notifications...
     */
    constructor() {
        console.log("Toast Module Loaded");
    }

    TOAST_TYPES = {
        INFO: "info",
        ERROR: "error",
        WARNING: "warning",
        SUCCESS: "success",
    };

    /**
     * Create a toast directly from an API reponse object
     * Will parse the type of the response - acts as a wrapper for create_toast()
     */
    api_toast(api_object) {
        let type = this.TOAST_TYPES.INFO;
        let message = api_object.data || api_object.message;

        if (api_object.status == "error") {
            type = this.TOAST_TYPES.ERROR;
        } else if (api_object.status == "ok") {
            type = this.TOAST_TYPES.SUCCESS;
        } else {
            type = this.TOAST_TYPES.INFO;
            console.warn(
                "Warning: Unknown specified api object response status"
            );
        }

        this.create_toast(message, type);
    }

    /**
     * Can be type: [info, error, warning, success]
     */
    create_toast(message, type = "info") {
        toastr.options = {
            closeButton: true,
            debug: false,
            newestOnTop: false,
            progressBar: false,
            positionClass: "toast-bottom-center",
            // "preventDuplicates": true,
            onclick: null,
            showDuration: "300",
            hideDuration: "1000",
            timeOut: "4000",
            extendedTimeOut: "1000",
            showEasing: "swing",
            hideEasing: "linear",
            showMethod: "fadeIn",
            hideMethod: "fadeOut",
        };

        message = message.charAt(0).toUpperCase() + message.slice(1);
        toastr[type](message);
    }
}
