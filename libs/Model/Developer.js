const Tokenable = require("../Private/Tokenable");

class Developer extends Tokenable {
    constructor() {
        super('developers');
        this.setAlias(this.constructor.name);
    }
    fillable = [
        'username',
        'password',
        'email',
    ]
}

module.exports = new Developer();
