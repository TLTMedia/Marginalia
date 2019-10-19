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
}
