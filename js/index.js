/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Users } from './ModuleLoader.js';

$(async () => {
    let xyz = new APIHandler();
    console.log("APIHandler is:", xyz);

    let abc = await new Users();
    console.log("Users is:", abc.user_list);
});