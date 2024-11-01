class LoadModel {
    constructor() {
    }

    init(model) {
        const Model = require(`../Model/${model}`);
        return Model;
    }
}

module.exports = new LoadModel();