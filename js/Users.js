import { APIHandler } from "./APIHandler.js";

export class Users {
    constructor({grouping = ''} = {}) {
        this.grouping = grouping;
        this.user_list = await this.get_users();
        console.log(this.user_list);
    }

    async get_users() {
        let api = new APIHandler();
        api.request({
            endpoint: 'get_users',
            method: 'get',
            data: this.grouping
        }).then(function(data) {
            return data;
        });
    }
}
