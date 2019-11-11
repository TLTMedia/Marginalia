/**
 * This library does not work properly when placed inside an async function.
 * Thus, any functions it calls must be placed in a queue to later be executed
 * once the primary app init is complete.
 */
export class Address {
    constructor({ state = state }) {
        this.state = state;

        this.address = $.address.init(() => {
            console.log("jQuery.Address Library/Module Loaded");
        });

        this.address_types = {
            "addlit": {
                "name": null
            },
            "tutorial": {
                "name": showTutorialPage
            },
        };

        /**
         * TODO: this whole thing is a mess... need to fix.
         * allows going back and direct linking of a page.
         */

        // on load & change
        this.address.externalChange(() => {
            if (location.hash) {
                this.process_deep_linked_url();
            }
        });

        // on change
        window.onhashchange = () => {
            if (window.innerDocClick) {
                window.innerDocClick = false;
            } else {
                if (window.location.hash) {
                    this.process_deep_linked_url();
                } else {
                    history.pushState("", document.title, window.location.pathname);
                    window.location.href = window.location.href;
                }
            }
        }
    }

    process_deep_linked_url() {
        let [, api, ...rest] = location.hash.split("#")[1].split("/");
        if (api == "get_work") {
            this.state.deep_link = {
                function: "show_work",
                parameters: [...rest],
            };
        }
    }
}
