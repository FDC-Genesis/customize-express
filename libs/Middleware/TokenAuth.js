class TokenAuth {
    #id;
    #user;
    constructor(data) {
        this.#id = data.id;
        this.#user = data;
    }
    id() {
        return this.#id;
    }
    user() {
        return this.#user;
    }
    logout() {
        // Implement logout logic here
    }
}

module.exports = TokenAuth;