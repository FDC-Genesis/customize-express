const Blueprint = require('../../libs/Service/Blueprint');
const Configure = require('../../libs/Service/Configure');
const DatabaseConnection = require('../database');

async function up() {
    const blueprint = new Blueprint();
    const tableName = 'developer_access_tokens';
    const db = new DatabaseConnection();

    blueprint.id();
    let structure = Configure.read('auth.token_table_structure');
    let keys = Object.keys(structure);
    keys.forEach(element => {
        if (element != 'timestamp') {
            blueprint[structure[element].type](element);
        } else {
            blueprint.timestamp();
        }
    });
    keys.forEach(element => {
        if (element != 'timestamp' && structure[element].default !== undefined) {
            blueprint.columns.find(col => col.name === element).type += ` DEFAULT ${structure[element].default === null ? 'NULL' : structure[element].default}`;
        }
    });

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
