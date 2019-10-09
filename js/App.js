/**
 * Initialization of Marginalia scripts begin here
 */
import { APIHandler, Comments, Dom, RangyHelper, Users } from './ModuleLoader.js';

(async () => {
  const api = new APIHandler();
  const users = await new Users({ api });
  // const dom = new Dom({api: api});
  // let my_works = await users.get_user_works(users.current_user['eppn']);
  // console.log(my_works);
  // console.log(users);

  // const comments = await new Comments({api: api, work: my_works[0], eppn:
  // users.current_user['eppn']}); console.log(comments)

  init({ api: api, users: users });
})();
