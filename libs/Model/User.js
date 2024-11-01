const Tokenable = require("../Private/Tokenable");

class User extends Tokenable {
    constructor() {
        super('users');
        this.setAlias(this.constructor.name);
    }
    fillable = [
        'username',
        'password',
        'email',
    ]
}

module.exports = new User();
