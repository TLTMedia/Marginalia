/**
 * Initialization of Marginalia scripts begin here
 */
import {
    InterfaceController,
    APIHandler,
    Data,
    Toast,
    Shibboleth,
    QueryString,
} from "./Modules/_ModuleLoader.js";

(async () => {
    /**
     * Shibboleth Ping,
     * It's blocking - nothing else happens until the request resolves.
     */
    const shibboleth = new Shibboleth();
    await shibboleth.ping();

    /**
     * Our main state for Marginalia.
     */
    const state = {};

    /**
     * The name of the deeplink html page
     */
    state.deep_link_page = "work.html";

    /**
     * Address object must be created before any awaits.
     * Otherwise its event listeners do not fire off.
     */
    state.query_string = new QueryString({ state: state });

    /**
     * Create the Quill editor
     */
    state.quill = new Quill("#quill-editor", {
        theme: "snow",
        placeholder: "type your text here...",
        modules: {
            toolbar: [
                ["bold", "italic", "underline", "strike"],
                ["blockquote", "code-block"],
                ["image"],
            ],
        },
    });

    /**
     * Add a function to Quill - to get the raw HTML of the textarea.
     */
    Quill.prototype.getHTML = function () {
        return this.container.querySelector(".ql-editor").innerHTML;
    };

    /**
     * Adds a function to Quill - to set the raw HTML of the textarea.
     */
    Quill.prototype.setHTML = function (html) {
        this.container.querySelector(".ql-editor").innerHTML = html;
    };

    /**
     * Toast module
     */
    const toast = new Toast();

    /**
     * Creates the API handler object which is responsible for dealing with all of Marginalia's API calls;
     * This object should only be used in "Data" Class/Objects
     *
     * ... now pass in toast so that we don't need to call the global launchToastNotification().
     * NOTE: this reference to `toast` is unconventional since all other references originate from InterfaceController.toast
     */
    const api = new APIHandler({ toast: toast });

    /**
     * The data class creates all the other data classes which contain methods for API requests
     */
    const data = new Data({ state: state, api: api });
    state.api_data = data;

    /**
     * Classes that need awaited objects
     */
    const ui = new InterfaceController({
        state: state,
        toast: toast,
    });

    /**
     * Call the init() script of Marginalia
     */
    init({
        state: state,
        ui: ui,
        api: api, // remove eventually
    });
})();
