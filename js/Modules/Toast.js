export class Toast {
    /**
     * TODO: This is temporarily just a wrapper around Toast notifications...
     */
    constructor() {
        console.log("Toast Module Loaded");
    }

    create_toast(message) {
        launchToastNotifcation(message);
    }
}