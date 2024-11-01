const Model = require("../Main/Model");
const crypto = require("crypto");
const Validator = require("../Middleware/Validator");
const Core = require("../Main/CoreClone");
const Configure = require("../Service/Configure");

class Tokenable extends Model {
    #tokenName;
    token;
    #tokenable = true;
    #privateCore = null;
    constructor(tableName) {
        super(tableName);
    }

    async createToken(user_id = null, name = "token", expires = Configure.read('auth.token_expiration')) {
        if (!user_id) {
            throw new Error(`ID is required to generate a token for ${this.getModelName()}`);
        }
        this.#generatePrivateCore('access_tokens');
        this.#tokenName = name;
        let token;
        let validate = true;
        do {
            token = crypto.randomBytes(name == 'token' ? 16 : (name == 'bearer' ? 32 : 24)).toString('hex');
            validate = await Validator.make({ token }, {
                token: `required|unique:${Configure.read(`auth.access_tokens.${this.getModelName()}.table`)}`
            });
        } while (validate.fails());
        let expires_at = this.getFutureDate(expires);
        this.#privateCore.set({ user_id, token, name, expires_at });
        let data = await this.#privateCore.save();
        if (data) {
            return token;
        } else {
            throw new Error(`Failed to create token for ${this.getModelName()}`);
        }
    }

    async getSecretId(client_key, client_secret) {
        const secretTable = Configure.read(`auth.secrets.${this.getModelName()}.table`);
        const secretAlias = `${this.getModelName()}Secret`;
        const alias = this.getModelName();

        let paramsSecret = {};
        paramsSecret['fields'] = [
            `${secretAlias}.id as secret_id`, `${alias}.*`
        ];
        paramsSecret.conditions = {
            [`${secretAlias}.client_key`]: ['=', client_key],
            [`${secretAlias}.client_secret`]: ['=', client_secret]
        }
        paramsSecret['joins'] = [
            {
                table: secretTable,
                as: secretAlias,
                conditions: [
                    `${alias}.id = ${secretAlias}.user_id`
                ],
                type: 'LEFT'
            }
        ];
        let secret = await this.find('first', paramsSecret);
        if (secret) delete secret.password;
        return secret ?? false;
    }
    #generatePrivateCore(table) {
        if (Configure.read(`auth.${table}.${this.getModelName()}.table`) === undefined) {
            throw new Error(`Table name for ${this.getModelName()} is not configured in auth.${table}`);
        }
        this.#privateCore = new Core(Configure.read(`auth.${table}.${this.getModelName()}.table`));
    }

    async getToken(id = null, name = 'token') {
        let allowedAuths = ['token', 'bearer'];
        if (!id && !name) {
            throw new Error(`Either ID or name is required to retrieve a token for ${this.getModelName()}`);
        }
        this.#generatePrivateCore(name == 'token' ? 'access_tokens' : 'bearer_tokens');
        let params = {};
        params.conditions = {};
        if (id) {
            params.conditions.user_id = ['=', id];
        }
        if (name) {
            params.conditions.name = ['=', name];
        }
        let token = await this.#privateCore.find(params);
        if (!token ?? new Date(token.expires_at) < new Date()) {
            return await this.createToken(id, name);
        }
        return token.token;
    }
    async getUserByToken(token = null, name = 'token') {
        const alias = this.getModelName();
        if (!token) {
            throw new Error(`Token is required to retrieve a user for ${alias}`);
        }
        const tokenTable = Configure.read(`auth.access_tokens.${alias}.table`);
        const tokenAlias = `${alias}Token`;
        const secretTable = Configure.read(`auth.secrets.${alias}.table`);
        const secretAlias = `${alias}Secret`;
        const params = {};
        params['fields'] = [
            `${alias}.*`, `${secretAlias}.client_key`, `${secretAlias}.client_secret`
        ];
        params['conditions'] = {
            [`${tokenAlias}.token`]: ['=', token],
            [`${tokenAlias}.name`]: ['=', name],
            [`${tokenAlias}.expires_at`]: ['>', this.formatDate(new Date())],
            [`${tokenAlias}.is_revoked`]: ['=', 0]
        };
        params['joins'] = [
            {
                table: tokenTable,
                as: tokenAlias,
                type: 'LEFT',
                conditions: [
                    `${alias}.id = ${tokenAlias}.user_id`
                ]
            },
            {
                table: secretTable,
                as: secretAlias,
                type: 'LEFT',
                conditions: [
                    `${alias}.id = ${secretAlias}.user_id`
                ]
            }
        ];
        let data = await this.find('first', params);
        return data ?? false;
    }

    async createSecret(user_id = null) {
        if (!user_id) {
            throw new Error(`ID is required to generate a secret for ${this.getModelName()}`);
        }
        this.#generatePrivateCore('secrets');
        let client_secret;
        let client_key
        let validate = true;
        do {
            client_secret = crypto.randomBytes(4).toString('hex');
            client_key = crypto.randomBytes(4).toString('hex');
            let secretData = { client_secret, client_key };
            validate = await Validator.make({ secretData }, {
                secretData: `exists:${Configure.read(`auth.secrets.${this.getModelName()}.table`)}`
            });
        } while (validate.fails());
        this.#privateCore.set({ user_id, client_key, client_secret });
        let data = await this.#privateCore.save();
        if (data) {
            return data;
        }
        return false;
    }

    async getBearer(secret_id, name = 'bearer') {
        this.#generatePrivateCore('bearer_tokens');
        const bearerTable = this.#privateCore.tableName;
        const alias = this.getModelName();
        const bearerAlias = `${alias}Bearer`;
        const secretTable = Configure.read(`auth.secrets.${this.getModelName()}.table`);
        const secretAlias = `${alias}Secret`;
        let params = {};
        params['fields'] = [
            `${bearerAlias}.token`
        ];
        params['conditions'] = {
            [`${secretAlias}.id`]: ['=', secret_id],
            [`${bearerAlias}.name`]: ['=', name],
            [`${bearerAlias}.expires_at`]: ['>', this.formatDate(new Date())],
            [`${bearerAlias}.is_revoked`]: ['=', 0]
        };
        params['joins'] = [
            {
                table: secretTable,
                as: secretAlias,
                type: 'LEFT',
                conditions: [
                    `${alias}.id = ${secretAlias}.user_id`
                ]
            },
            {
                table: bearerTable,
                as: bearerAlias,
                type: 'LEFT',
                conditions: [
                    `${secretAlias}.id = ${bearerAlias}.secret_id`
                ]
            }
        ];
        const bearer = await this.find('first', params);
        if (!bearer) {
            return await this.#createBearer(secret_id, name);
        }
        return bearer.token;
    }

    async #createBearer(secret_id, name = 'bearer', expires_at = Configure.read('auth.token_expiration')) {
        this.#generatePrivateCore('bearer_tokens');
        let token;
        let validate;
        do {
            token = this.generateRandomToken(32);
            validate = await Validator.make({ token }, {
                token: `unique:${this.#privateCore.tableName}`
            });
        }
        while (validate.fails());
        expires_at = this.getFutureDate(expires_at);
        this.#privateCore.set({ secret_id, token, name, expires_at });
        let data = await this.#privateCore.save();
        return data ? token : false;
    }

    generateRandomToken(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    async getUserByBearer(bearer, name = 'bearer') {
        const alias = this.getModelName();
        const bearerTable = Configure.read(`auth.bearer_tokens.${alias}.table`);
        const bearerAlias = `${alias}Bearer`;
        const secretTable = Configure.read(`auth.secrets.${alias}.table`);
        const secretAlias = `${alias}Secret`;
        const params = {};
        params['fields'] = [
            `${alias}.*`
        ];
        params['conditions'] = {
            [`${bearerAlias}.token`]: ['=', bearer],
            [`${bearerAlias}.name`]: ['=', name],
            [`${bearerAlias}.expires_at`]: ['>', this.formatDate(new Date())],
            [`${bearerAlias}.is_revoked`]: ['=', 0]
        };
        params['joins'] = [
            {
                table: bearerTable,
                as: bearerAlias,
                type: 'LEFT',
                conditions: [
                    `${alias}.id = ${bearerAlias}.secret_id`
                ]
            },
            {
                table: secretTable,
                as: secretAlias,
                type: 'LEFT',
                conditions: [
                    `${secretAlias}.id = ${bearerAlias}.secret_id`
                ]
            }
        ];
        let data = await this.find('first', params);
        return data ?? false;
    }
}

module.exports = Tokenable;