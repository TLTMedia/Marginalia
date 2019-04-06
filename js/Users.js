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

    async get_user_works(eppn) {
        this.selected_user_works = await this.api.request({
            endpoint: 'get_works/' + eppn
        });
        /* remove '.html' */
        this.selected_user_works.forEach((work, index) => {
            this.selected_user_works[index] = this.selected_user_works[index].substr(0, this.selected_user_works[index].lastIndexOf('\.'));
        });
        return this.selected_user_works;
    }
}
