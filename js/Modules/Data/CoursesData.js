export class CoursesData {
    constructor({ state = state, api = api }) {
        console.log("Data/CoursesData Module Loaded");

        this.state = state;
        this.api = api;
    }

    async get_course_list() {
        let course_list = this.api.request({
            endpoint: 'courses',
        });

        return await course_list;
    }

    /**
     * Gets list of users that have works in a specified course.
     */
    async get_course_creators() {
        let creators_list = this.api.request({
            endpoint: 'get_creators_of_course',
            data: {
                course: this.state.selected_course,
            },
        });

        return await creators_list;
    }

    async is_user_course_admin() {
        let is_admin = this.api.request({
            endpoint: 'is_courses_admin',
        });

        return await is_admin;
    }

    async add_course(course) {
        let response = this.api.request({
            endpoint: 'add_course',
            method: 'POST',
            data: {
                course: course,
            },
        });

        return await response;
    }
}