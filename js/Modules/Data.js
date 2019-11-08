import { CoursesData, UsersData, WorksData, CommentsData } from './Data/_ModuleLoader.js';

export class Data {
    constructor({ state = state, api = api }) {
        console.log("Data Module Loaded");

        /**
         * Binds the Data objects to this object.
         */

        this.courses_data = new CoursesData({
            state: state,
            api: api,
        });

        this.users_data = new UsersData({
            state: state,
            api: api,
        });

        this.works_data = new WorksData({
            state: state,
            api: api,
        });

        this.comments_data = new CommentsData({
            state: state,
            api: api,
        });
    }
}
