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

    async get_course_creators(course) {
        let creators_list = this.api.request({
            endpoint: 'get_creators_of_course',
            data: {
                course: course,
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

    async add_course(courseName) {
        let respond = this.api.request({
            endpoint: "add_course",
            data: {
                course: courseName,
            },
            method: "POST",
        });

        return await respond;
    }
}
