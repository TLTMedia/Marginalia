/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Users } from './ModuleLoader.js';

(async () => {
    const api = new APIHandler();
    const users = await new Users({api: api});
    console.log("Users is:", users.user_list);
    console.log("Current users is:", users.current_user);
    init(users.current_user);
})();