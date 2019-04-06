import { APIHandler } from "./APIHandler.js";

export class Users {
    constructor({grouping = ''} = {}) {
        this.grouping = grouping;
        return (async () => {
            this.user_list = await this.get_users();
            return this;
        })();
    }

    async get_users() {
        let api = new APIHandler();
        let user_list = api.request({
            endpoint: 'get_users',
            method: 'get',
            data: this.grouping
        });
        return await user_list;
    }
}
