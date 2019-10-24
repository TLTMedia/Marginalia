/**
 * This library does not work properly when placed inside an async function.
 * Thus, any functions it calls must be placed in a queue to later be executed
 * once the primary app init is complete.
 */
$.address.init(() => {
    console.log("jQuery.Address Library Loaded");
}).externalChange(function () {
    if (location.hash) {
        [, api, ...rest] = location.hash.split("#")[1].split("/");
        if (api == "get_work") {
            let obj = {
                "name": selectLit,
                "parameters": [...rest],
            };
            event_queue.push(obj);
        }
    } else {
        let obj = {
            "name": homeButtonAction,
            "parameters": [],
        };
        event_queue.push(obj);
    }
});
