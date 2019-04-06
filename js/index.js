/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Users } from './ModuleLoader.js';

(async () => {
    const api = new APIHandler();
    const users = await new Users({api});
    
    init(users.current_user);
})();