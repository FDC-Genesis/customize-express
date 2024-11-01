const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class Hash {
    constructor() {
        this.bcrypt = bcrypt;
    }

    // SHA-1 hash, then bcrypt
    make(password) {
        const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
        return this.bcrypt.hashSync(sha1Hash, 10);
    }

    // SHA-1 hash, then bcrypt check
    check(password, hash) {
        const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
        return this.bcrypt.compareSync(sha1Hash, hash);
    }
}

module.exports = new Hash();
