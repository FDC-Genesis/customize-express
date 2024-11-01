const mysql = require('mysql2');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

class DatabaseConnection {
    constructor() {
        this.debugger = (process.env.DEBUGGER || 'false') === 'true';
        this.connection = null;
    }

    openConnection() {
        const isSQLite = process.env.DATABASE === 'sqlite';

        if (isSQLite) {
            const dbPath = path.join(__dirname, '../database', 'database.sqlite');
            this.connection = new Database(dbPath);
        } else {
            this.connection = mysql.createConnection({
                host: process.env.MYSQL_ADDON_HOST || 'localhost',
                user: process.env.MYSQL_ADDON_USER || 'root',
                password: process.env.MYSQL_ADDON_PASSWORD || '',
                database: process.env.MYSQL_ADDON_DB || 'express',
                port: process.env.MYSQL_ADDON_PORT || 3306
            });

            this.connection.connect((err) => {
                if (err) {
                    console.error('Error connecting to MySQL database:', err.message);
                    this.connection = null;
                }
            });
        }
    }

    async runQuery(query, params = []) {
        const isSQLite = process.env.DATABASE === 'sqlite';

        try {
            this.openConnection();

            if (!this.connection) {
                throw new Error('Database connection is not established.');
            }

            if (isSQLite) {
                const stmt = this.connection.prepare(query);
                const isInsert = query.trim().toLowerCase().startsWith('insert');

                if (isInsert) {
                    stmt.run(params);
                    const lastInsertId = stmt.lastInsertRowid;
                    return lastInsertId;
                } else {
                    const result = stmt.all(params);
                    return result;
                }
            } else {
                return new Promise((resolve, reject) => {
                    this.connection.query(query, params, (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            const isInsert = query.trim().toLowerCase().startsWith('insert');
                            if (isInsert) {
                                resolve(results.insertId);
                            } else {
                                resolve(results);
                            }
                        }
                    });
                });
            }
        } catch (err) {
            throw err;
        } finally {
            await this.close();
        }
    }


    async close() {
        if (!this.connection) return;

        if (process.env.DATABASE === 'sqlite') {
            this.connection.close();
        } else {
            await new Promise((resolve, reject) => {
                this.connection.end((err) => {
                    if (err) {
                        console.error('Error closing the MySQL connection:', err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        this.connection = null;
    }

}

module.exports = DatabaseConnection;
