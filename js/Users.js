import { APIHandler } from "./APIHandler.js";

export class Users {
    async constructor({grouping = ''} = {}) {
        this.grouping = grouping;
        this.user_list = await this.get_users();
        console.log(this.user_list);
    }

    get_users() {
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
