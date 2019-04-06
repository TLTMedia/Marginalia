import { APIHandler } from "./APIHandler.js";

export class Users {
    constructor({grouping = ''} = {}) {
        this.grouping = grouping;
        this.user_list = this.get_users();
        console.log(this.user_list['data']);
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
