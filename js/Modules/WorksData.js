export class WorksData {
    constructor({ state, api } = {}) {
        console.log("WorksData Module Loaded");

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

    async get_admins_of_work(selected_eppn, selected_work) {
        let admin_list = this.api.request({
            endpoint: 'get_permissions_list',
            data: {
                eppn: selected_eppn,
                work: selected_work,
            },
        });

        return await admin_list;
    }

    /**
     * Add a specified users eppn to the currently logged in users specified work
     */
    async add_work_permission(selected_work, eppn_to_add) {
        let response = this.api.request({
            endpoint: 'add_permission',
            method: 'POST',
            data: {
                work: decodeURI(selected_work),
                eppn: eppn_to_add,
            },
        });

        return await response;
    }

    /**
     * Remove a specified users eppn from the currently logged in users specified work
     */
    async remove_work_permission(selected_work, eppn_to_remove) {
        let response = this.api.request({
            endpoint: 'remove_permission',
            method: 'POST',
            data: {
                work: decodeURI(selected_work),
                eppn: eppn_to_remove,
            },
        });

        return await response;
    }
}
