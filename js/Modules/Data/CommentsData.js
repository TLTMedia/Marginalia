export class CommentsData {
    constructor({ state = state, api = api }) {
        console.log("Data/CommentsData Module Loaded");

        this.state = state;
        this.api = api;
    }

    /**
     * Gets whether the currently selected work requires that its comments are approved
     */
    async get_comments_require_approval() {
        let requires_approval = this.api.request({
            endpoint: 'is_comments_require_approval',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
            },
        });

        return await requires_approval;
    }

    /**
     * Sets whether the currently selected work requires that its comments are approved
     */
    async set_comments_require_approval(approval) {
        let requires_approval = this.api.request({
            endpoint: 'set_require_approval',
            method: 'POST',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
                approval: approval,
            },
        });

        return await requires_approval;
    }

    /**
     * Get the first level comments (highlights from the work)
     */
    async get_work_highlights() {
        let response = this.api.request({
            endpoint: 'get_highlights',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
            },
        });

        return await response;
    }

    /**
     * Get the first level comments (highlights from the work) - but filtered
     */
    async get_work_highlights_filtered() {
        /**
         * TODO: this appends @stonybrook.edu onto the author filter; b/c the stored author filter
         * doesn't contain the @stonybrook.edu... but the api expects it to be there...
         * Make the state store that info (@stonybrook.edu)
         */
        let selected_commenter = this.state.filters.selected_author_filter;
        if (selected_commenter.indexOf("@") == -1 && selected_commenter != "show-all-eppns") {
            selected_commenter += "@stonybrook.edu"
        } else {
            // when having no filter for the commenter, an empty string is expected.
            // same with the filter for the type.
            selected_commenter = "";
        }

        let selected_type = this.state.filters.selected_comment_filter;
        if (selected_type == "show-all-types") {
            selected_type = "";
        }

        let response = this.api.request({
            endpoint: 'get_highlights_filtered',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
                filterEppn: selected_commenter,
                filterType: selected_type,
            },
        });

        return await response;
    }

    /**
     * Save a comment.
     */
    async save_comment(data) {
        let response = this.api.request({
            endpoint: 'save_comments',
            method: 'POST',
            data: data,
        });

        return await response;
    }

    async edit_comment(data) {
        let response = this.api.request({
            endpoint: 'edit_comment',
            method: 'POST',
            data: data
        });

        return await response;
    }

    async delete_comment(data) {
        let response = this.api.request({
            endpoint: 'delete_comment',
            method: 'POST',
            data: data
        });

        return await response;
    }

    async change_comment_approval(data, endpoint) {
        let response = this.api.request({
            endpoint: endpoint,
            method: "POST",
            data: data
        });

        return await response;
    }

    async change_comment_privacy(data) {
        let response = this.api.request({
            endpoint: "set_comment_public",
            method: "POST",
            data: data
        });

        return await response;
    }

    async get_comment_chain(data) {
        let response = this.api.request({
            endpoint: "get_comment_chain",
            method: "GET",
            data: data
        });

        return await response;
    }

    async get_unapprove_comments(data){
        //TODO might want to move this away
        $(".commented-selection").removeClass("unapprovedComments threadNotApproved");
        let response = this.api.request({
            endpoint: "unapproved_comments",
            method: "GET",
            data: data
        });

        return await response;
    }

    async get_comments_by_index(data){
        let response = this.api.request({
            endpoint: "comments_within_index",
            method: "GET",
            data: data
        });
        return response;
    }
}
