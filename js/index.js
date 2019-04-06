/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Users, Comments } from './ModuleLoader.js';

(async () => {
    const api = new APIHandler();
    const users = await new Users({api});
    //const comments = await new Comments({api});
    console.log(users.get_user_works('ikleiman@stonybrook.edu'));
    console.log(users);
    init(users.current_user);
})();