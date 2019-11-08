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
}
