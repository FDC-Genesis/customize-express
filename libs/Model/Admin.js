const Tokenable = require("../Private/Tokenable");

class Admin extends Tokenable {
    hasApiToken = true;
    constructor() {
        super('admins');
        this.setAlias(this.constructor.name);
    }
    fillable = [
        'username',
        'email',
        'password',
    ];
}

module.exports = new Admin();