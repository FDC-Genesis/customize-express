const DatabaseConnection = require('../../database/database');
require('dotenv').config();

class Migrator {
    constructor() {
        this.db = new DatabaseConnection();
        this.sql = [];
    }

    // Use async for migrate method to handle async queries
    async migrate() {
        for (const sql of this.sql) {
            try {
                await this.db.runQuery(sql);
                await this.db.close();
            } catch (error) {
                console.error("Error executing migration:", error.message);
            }
        }
    }

    addSql(sql) {
        this.sql.push(sql);
    }
}

module.exports = Migrator;
