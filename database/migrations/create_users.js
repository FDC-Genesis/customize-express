const Blueprint = require('../../libs/Service/Blueprint');
const DatabaseConnection = require('../database');

async function up() {
    const blueprint = new Blueprint();
    const tableName = 'users';
    const db = new DatabaseConnection();

    blueprint.id();
    blueprint.string('email');
    blueprint.string('username');
    blueprint.string('password');
    blueprint.timestamp();

    const columns = blueprint.getColumns();

    try {
        await db.runQuery(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`);
        db.close();
        console.log(`Table ${tableName} created successfully.`);
    } catch (err) {
        console.error(`Error creating table ${tableName}:`, err);
    } finally {
    }
}

up();