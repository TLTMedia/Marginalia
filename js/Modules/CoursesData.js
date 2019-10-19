export class CoursesData {
    constructor(api) {
        console.log("CoursesData Module Loaded");

        this.api = api;
    }

    async get_course_list() {
        let course_list = this.api.request({
            endpoint: 'courses'
        });
        return await course_list;
    }
}