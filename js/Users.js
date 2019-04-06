import { APIHandler } from "./APIHandler.js";

export class Users {
    constructor({grouping = ''} = {}) {
        this.grouping = grouping;
        this.user_list = this.get_users();
    }

    async get_users() {
        let api = new APIHandler();
        let user_list = api.request({
            endpoint: 'get_users',
            method: 'get',
            data: this.grouping,
            callback: console.log
        });
        console.log("returned user list", user_list);
    }
}
