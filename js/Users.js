export class Users {
    constructor({api, grouping = ''} = {}) {
        this.api = api;
        this.grouping = grouping;
        return (async () => {
            this.user_list = await this.get_users();
            this.current_user = await this.get_current_user();
            return this;
        })();
    }

    async get_users() {
        let user_list = this.api.request({
            endpoint: 'get_users',
            data: this.grouping
        });
        return await user_list;
    }

    async get_current_user() {
        let user = this.api.request({
            endpoint: 'get_current_user'
        });
        return await user;
    }
}
