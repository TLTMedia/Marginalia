export class Users {
    constructor({api, grouping = ''} = {}) {
        this.api = api;
        this.grouping = grouping;
        return (async () => {
            this.user_list = await this.get_users();
            return this;
        })();
    }

    async get_users() {
        let user_list = this.api.request({
            endpoint: 'get_users',
            method: 'get',
            data: this.grouping
        });
        return await user_list;
    }
}
