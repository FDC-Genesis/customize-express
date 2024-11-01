const DatabaseConnection = require('../../database/database');
const GlobalFunctions = require('../Base/GlobalFunctions');

class Core extends GlobalFunctions {
    #values;
    #privateColumns = {};
    constructor(tableName) {
        super();
        this.tableName = tableName;
        this.db = new DatabaseConnection();
        this.debug = this.db.debugger;
        this.#values = [];
    }

    async find(options) {
        let sql = `SELECT `;
        const conditions = options.conditions || {};
        const builtConditions = this.buildConditions(conditions);
        this.#values.push(...builtConditions.values);
        sql += `* FROM ${this.tableName} ${builtConditions.sql} LIMIT 1`.trim() + ";";

        if (this.debug) {
            console.log("SQL Query:", sql);
            console.log("Query Values:", this.#values);
        }

        try {
            const data = await this.db.runQuery(sql, this.#values);
            await this.db.close();
            return data[0] ? data[0] : null; // Ensure it returns null if no data found
        } catch (error) {
            console.error("Error executing query:", error);
            throw error;
        } finally {
            this.#values = [];
        }
    }

    buildConditions(conditions = {}) {
        let sqlConditions = [];
        let values = [];

        Object.entries(conditions).forEach(([key, condition]) => {
            const [operator, conditionValue] = condition; // Destructure operator and value

            switch (operator.toUpperCase()) {
                case 'IS':
                    sqlConditions.push(`${key} IS ${conditionValue}`);
                    break;

                case 'IN':
                    const placeholders = conditionValue.map(() => '?').join(', ');
                    sqlConditions.push(`${key} IN (${placeholders})`);
                    values.push(...conditionValue); // Add the values to the array
                    break;

                case 'BETWEEN':
                    const [lowerBound, upperBound] = conditionValue;
                    sqlConditions.push(`${key} BETWEEN ? AND ?`);
                    values.push(lowerBound, upperBound);
                    break;

                case 'LIKE':
                case '=':
                case 'NOT LIKE':
                    sqlConditions.push(`${key} ${operator} ?`);
                    values.push(conditionValue);
                    break;

                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        });

        return {
            sql: sqlConditions.length > 0 ? `WHERE ${sqlConditions.join(' AND ')}` : '',
            values: values
        };
    }

    async create(data = {}) {
        const newData = Object.keys(data)
            .filter(key => this.fillable.includes(key))
            .reduce((acc, key) => {
                acc[key] = data[key];
                return acc;
            }, {});

        if (Object.keys(newData).length === 0) {
            throw new Error('No fillable data provided.');
        }

        if (this.timestamps) {
            const now = new Date();
            newData.created_at = this.formatDate(now);
            newData.updated_at = this.formatDate(now);
        }

        return await this.#insert(newData);
    }

    async #insert(data = {}) {
        if (!data || Object.keys(data).length === 0) {
            throw new Error('No data provided for insertion.');
        }

        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');

        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
        this.#values = Object.values(data);

        if (this.debug) {
            console.log(sql);
            console.log(this.#values);
        }

        try {
            const result = await this.db.runQuery(sql, this.#values);
            await this.db.close();
            return result ?? null;
        } catch (error) {
            throw new Error(`Error inserting data: ${error.message}`);
        } finally {
            this.#values = [];
        }
    }

    set(data = {}) {
        let keys = Object.keys(data);
        keys.forEach((ele) => {
            this.#privateColumns[ele] = data[ele];
        });
    }

    async save(data = {}) {
        return await this.#insert(this.#privateColumns);
    }
}

module.exports = Core;
