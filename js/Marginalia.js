/**
 * Initialization of Marginalia scripts begin here
 */
import { InterfaceController, APIHandler, CoursesData, UsersData, WorksData, CommentsData, Toast, Address } from './Modules/_ModuleLoader.js';

(async () => {
    const state = {};

    /**
     * Address object must be created before any awaits.
     * Otherwise its event listeners do not fire off.
     */
    const address = new Address({ state: state });

    const toast = new Toast();
    const api = new APIHandler();

    /** 
     * Since we're using multiple await's in a single async - 
     * we must first declare each, then we can await them all 
     */
    const courses_init = new CoursesData({
        state: state,
        api: api,
    });
    const users_init = new UsersData({
        state: state,
        api: api,
    });
    const works_init = new WorksData({
        state: state,
        api: api,
    });
    const comments_init = new CommentsData({
        state: state,
        api: api,
    });

    /**
     * These must be await, 
     * & must be declared separately from their declarations
     * 
     * Cannot have inline await declarations e.g.) const courses = await new Courses(api);
     * You can if you have only 1 await in an async block, but not in this case where there's multiple. 
     */
    const courses_data = await courses_init;
    const users_data = await users_init;
    const works_data = await works_init;
    const comments_data = await comments_init;

    /**
     * Classes that need awaited objects
     */
    const ui = new InterfaceController({
        state: state,
        toast: toast,
        users_data: users_data,
        works_data: works_data,
        courses_data: courses_data,
        comments_data: comments_data,
    });

    init({
        state: state,
        ui: ui,
        api: api,
        courses: courses_data,
        users: users_data,
    });
})();