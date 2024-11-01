require('dotenv').config();

class Blueprint {
    constructor() {
        this.columns = [];
    }

    id() {
        const idDefinition = process.env.DATABASE === 'sqlite'
            ? 'INTEGER PRIMARY KEY'
            : 'INT AUTO_INCREMENT PRIMARY KEY';

        this.columns.push({ name: 'id', type: idDefinition });
    }

    string(name, length = 255) {
        const type = process.env.DATABASE === 'sqlite' ? 'TEXT' : `VARCHAR(${length})`;
        this.columns.push({ name, type });
    }

    text(name) {
        this.columns.push({ name, type: 'TEXT' });
    }

    integer(name) {
        this.columns.push({ name, type: 'INTEGER' });
    }

    float(name) {
        const type = process.env.DATABASE === 'sqlite' ? 'REAL' : 'FLOAT';
        this.columns.push({ name, type });
    }

    double(name) {
        const type = process.env.DATABASE === 'sqlite' ? 'REAL' : 'DOUBLE';
        this.columns.push({ name, type });
    }

    boolean(name) {
        const type = process.env.DATABASE === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
        this.columns.push({ name, type });
    }

    date(name) {
        this.columns.push({ name, type: 'DATE' });
    }

    datetime(name) {
        this.columns.push({ name, type: 'DATETIME' });
    }

    timestamp() {
        const createdAt = process.env.DATABASE === 'sqlite'
            ? 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
        const updatedAt = process.env.DATABASE === 'sqlite'
            ? 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';

        this.columns.push({ name: 'created_at', type: createdAt });
        this.columns.push({ name: 'updated_at', type: updatedAt });
    }

    getColumns() {
        return this.columns.map(col => `${col.name} ${col.type}`).join(', ');
    }
}

module.exports = Blueprint;
