export class QueryString {
    constructor({ state = state }) {
        console.log("QueryString Module Loaded");

        this.work_page = "work.html";
    }

    /**
     * Array of "key" - "value" mapped arguments for query string.
     * [
     *     {
     *          "key": "username",
     *          "value": "shortland",
     *     },
     *     {
     *          "key": "password",
     *          "value": "1234",
     *     },
     * ]
     *
     * SET will replace the current search/query string
     */
    set_work_query(key_value_pairs) {
        let current_url = window.location.origin + window.location.pathname;
        let generate_url = new URL(current_url);

        key_value_pairs.forEach((kv) => {
            generate_url.searchParams.set(kv.key, kv.value);
        });

        let new_link = this.work_page + generate_url.search;

        history.pushState(key_value_pairs, "", new_link);
    }
}
