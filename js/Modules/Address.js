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
                "name": showAddLitPage
            },
            "tutorial": {
                "name": showTutorialPage
            },
        };

        this.address.externalChange(() => {
            this.process_deep_linked_url();
        });
    }

    process_deep_linked_url() {
        if (location.hash) {
            let [, api, ...rest] = location.hash.split("#")[1].split("/");
            if (api == "get_work") {
                this.state.deep_link = {
                    function: "show_work",
                    parameters: [...rest],
                };
            } else if (api in this.address_types) {
                //CHANGED so deep link can also direct to addLit and tutorial page
                console.log("davids events");

                let obj = this.address_types[api];
                obj["parameters"] = [...rest];
                this.state.event_queue.push(obj);
            }
        } else {
            this.state.deep_link = {
                function: "show_home",
                parameters: [],
            };
        }
    }
}
