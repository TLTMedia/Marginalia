export class WorksData {
    constructor({ state = state, api = api }) {
        console.log("Data/WorksData Module Loaded");

        this.state = state;
        this.api = api;
    }

    async get_selected_course_works(course, creator) {
        let works_list = this.api.request({
            endpoint: 'get_works_of_course_creator',
            data: {
                course: course,
                creator: creator,
            },
        });

        return await works_list;
    }

    async get_admins_of_work() {
        let admin_list = this.api.request({
            endpoint: 'get_permissions_list',
            data: {
                eppn: this.state.selected_creator,
                work: this.state.selected_work,
            },
        });

        return await admin_list;
    }

    /**
     * Add a specified users eppn to the currently logged in users specified work
     */
    async add_work_permission(eppn_to_add) {
        let response = this.api.request({
            endpoint: 'add_permission',
            method: 'POST',
            data: {
                work: decodeURI(this.state.selected_work),
                eppn: eppn_to_add,
            },
        });

        return await response;
    }

    /**
     * Remove a specified users eppn from the currently logged in users specified work
     */
    async remove_work_permission(eppn_to_remove) {
        let response = this.api.request({
            endpoint: 'remove_permission',
            method: 'POST',
            data: {
                work: decodeURI(this.state.selected_work),
                eppn: eppn_to_remove,
            },
        });

        return await response;
    }

    /**
     * Delete the currently selected work
     */
    async delete_work() {
        let response = this.api.request({
            endpoint: 'delete_work',
            method: 'POST',
            data: {
                work: decodeURI(this.state.selected_work),
                creator: this.state.selected_creator,
            },
        });

        return await response;
    }

    /**
     * Upload a new work
     */
    async upload_work({ work_name = work_name, course = course, privacy = privacy, data = data }) {
        if (data.size > 2000000) {
            return {
                status: "error",
                message: "File too large to upload; try removing some images."
            };
        }

        /**
         * Create a FormData object for the file
         */
        const form_data = new FormData();
        form_data.append("work", work_name);
        form_data.append("course", course);
        form_data.append("privacy", privacy);
        form_data.append("file", data);

        let response = this.api.request({
            endpoint: 'create_work',
            method: 'POST',
            data: form_data,
            dataType: 'form',
            response_type: 'raw',
        });

        return await response;
    }

    /**
     * Get the privacy of the currently selected work
     */
    async get_work_privacy() {
        let privacy = this.api.request({
            endpoint: 'is_public',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
            },
        });

        return await privacy;
    }

    /**
     * Set the privacy of the currently selected work
     */
    async set_work_privacy(privacy) {
        let response = this.api.request({
            endpoint: 'set_privacy',
            method: 'POST',
            data: {
                creator: this.state.selected_creator,
                work: this.state.selected_work,
                privacy: privacy,
            },
        });

        return await response;
    }

    /**
     * Get the currently selected work data
     */
    async get_work_data() {
        let response = this.api.request({
            endpoint: 'get_work',
            data: {
                eppn: this.state.selected_creator,
                work: this.state.selected_work,
            },
            response_type: 'raw',
        });

        return await response;
    }
}
