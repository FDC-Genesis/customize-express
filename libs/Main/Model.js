const Core = require('./Core');

class Model extends Core {
    constructor(tableName, model) {
        super(tableName);
    }

    async find(type = 'all', options) {
        return await super.find(type, options);
    }
    async findByKey(key, data) {
        let params = {}
        params.conditions = {
            [key]: ['=', data]
        };
        return await super.find('first', params);
    }
}

module.exports = Model;