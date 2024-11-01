const crypto = require('crypto');
const constant = {
    secret: crypto.randomBytes(24).toString('hex'),
};

module.exports = constant;