/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Users } from './ModuleLoader.js';

(async () => {
    const xyz = new APIHandler();
    console.log("APIHandler is:", xyz);

    const abc = await new Users({api: xyz});
    console.log("Users is:", abc.user_list);
})();