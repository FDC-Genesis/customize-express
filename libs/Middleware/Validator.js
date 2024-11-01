const validRules = [
    'required',
    'email',
    'min',
    'max',
    'unique',
    'confirmed'
];

const axios = require('axios');
const DatabaseConnection = require('../../database/database');

class Validator {
    #req;
    params;
    #data;
    errors;
    validRules;
    old;
    uniques = [];
    constructor() {
        this.#initialize();
    }

    async handle() {
        let keysToValidate = Object.keys(this.params);
        for (const key of keysToValidate) {
            let rules = this.params[key].split('|');
            for (const rule of rules) {
                let [ruleName, ruleValue] = rule.split(':');
                const isValid = await this.#validate(key, ruleName, ruleValue);
                if (!isValid) {
                    break;
                }
            }
        }
    }

    #initialize() {
        this.errors = {};
        this.old = {};
        this.validRules = validRules;
        this.database = new DatabaseConnection();
    }

    async #validate(key, ruleName, ruleValue = undefined) {
        let returnData = true;

        switch (ruleName) {
            case 'required':
                if (!this.#data[key] || this.#data[key] === '') {
                    this.errors[key] = 'This field is required.';
                    returnData = false;
                }
                break;
            case 'email':
                if (!this.#validateEmail(this.#data[key])) {
                    this.errors[key] = 'Invalid email address.';
                    returnData = false;
                }
                break;
            case 'min':
                if (this.#data[key].length < Number(ruleValue)) {
                    this.errors[key] = `This field must be at least ${ruleValue} characters.`;
                    returnData = false;
                }
                break;
            case 'max':
                if (this.#data[key].length > Number(ruleValue)) {
                    this.errors[key] = `This field must be at most ${ruleValue} characters.`;
                    returnData = false;
                }
                break;
            case 'unique':
                const isUnique = await this.#validateUnique(this.#data[key], ruleValue, key);
                if (!isUnique) {
                    this.errors[key] = `The ${key} already used.`;
                    returnData = false;
                }
                break;
            case 'confirmed':
                if (this.#data[`${key}_confirmation`] !== this.#data[key]) {
                    this.errors[key] = 'This field must match the confirmation field.';
                    returnData = false;
                }
                break;
            case 'exists':
                const isNotExist = await this.#validateExists(this.#data[key], ruleValue);
                if (!isNotExist) {
                    this.errors[key] = 'This value exist.';
                    returnData = false;
                }
                break;
            default:
                break;
        }

        return returnData;
    }

    #validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    async #validateUnique(value, table, key) {
        let sql = `SELECT ${key} FROM ${table} WHERE ${key} = ?`;
        let data = await this.database.runQuery(sql, [value]); // Await the query execution
        return data.length === 0; // Check if no records were found
    }

    async #validateExists(value, table) {
        let keys = Object.keys(value);
        let sql = `SELECT id from ${table} WHERE `;
        let params = [];
        let values = [];
        keys.forEach(key => {
            params.push(`${key} = ?`);
            values.push(value[key]);
        });
        sql += params.join(' AND ');
        let data = await this.database.runQuery(sql, values);
        return data.length === 0;
    }

    /**
     * Checks if there are any validation errors.
     *
     * @returns {Object|boolean} Returns an object containing errors if validation fails, 
     *                           or false if there are no errors.
     */
    fails() {
        let returnData = (Object.keys(this.errors).length > 0);
        if (returnData) {
            let returnKeys = {};
            Object.keys(this.#data).forEach(key => {
                if (this.#data[key] !== '' && this.#data[key] !== null && typeof this.#data[key] !== 'undefined' && this.#data[key]) {
                    returnKeys[key] = this.#data[key];
                }
            });
            this.old = returnKeys;
        }
        return returnData;
    }

    revoke() {
        this.errors = {};
        this.old = {};
    }

    /**
     * Initializes the validator with the given data and parameters.
     *
     * @param {Object} req - The data to be validated.
     * @param {Object} [params={}] - Optional parameters for validation rules.
     * @returns {void} This function does not return a value. It handles validation.
     */
    async make(data = {}, params = {}) {
        this.#initialize();
        this.params = params;
        this.#data = data;
        await this.handle(); // Await the handle method for asynchronous operations
        return this;
    }
}

module.exports = new Validator();
