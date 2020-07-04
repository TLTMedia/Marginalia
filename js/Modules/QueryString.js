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

    /**
     * Get the course, creator, work from the current query string.
     * Returns null on error
     */
    get_meta_from_query() {
        let parse_url = new URL(window.location.href);

        // Parse out the needed values
        let course = parse_url.searchParams.get("course");
        let creator = parse_url.searchParams.get("creator");
        let work = parse_url.searchParams.get("work");

        // Check if any of them were null
        if (course == null || creator == null || work == null) {
            console.warn(
                "unable to parse query parameters when should of been able to"
            );

            return null;
        }

        return {
            course: course,
            creator: creator,
            work: work,
        };
    }
}
