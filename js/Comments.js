export class Comments {
    constructor({api, eppn, work} = {}) {
        this.api = api;
        return (async () => {
            this.comments = await this.get_comments(eppn, work);
            return this;
        })();
    }

    async get_comments(eppn, work) {
        let comments = this.api.request({
            endpoint: 'get_comments/' + eppn + '/' + work
        });
        return await comments;
    }
}
