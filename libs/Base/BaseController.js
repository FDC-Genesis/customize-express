const express = require('express');
const LoadModel = require('../Service/LoadModel');
const GlobalFunctions = require('./GlobalFunctions');
const Configure = require('../Service/Configure');


class BaseController extends GlobalFunctions {
    allowedAuths = ['auth', 'guest'];
    data = {};
    // prefix = "";
    constructor() {
        super();
        this.router = express.Router();
    }

    // authentications
    auth(role) {
        return (req, res, next) => {
            if (req.session.auth[role].isAuthenticated) {
                next();
                return;
            }
            return res.redirect(Configure.read(`auth.providers.${Configure.read(`auth.guards.${role}.provider`)}.failed`));
        }
    }
    guest(role) {
        return (req, res, next) => {
            if (!req.session.auth[role].isAuthenticated) {
                next();
                return;
            }
            return res.redirect(Configure.read(`auth.providers.${Configure.read(`auth.guards.${role}.provider`)}.passed`));
        }
    }
    // end of auitentications
    set(key, value) {
        this.data[key] = value;
    }

    loadUses(models = []) {
        if (Array.isArray(models) && models.length > 0) {
            models.forEach(use => {
                if (!this[use]) {
                    this[use] = LoadModel.init(use);
                }
            });
        }
    }
    get(prefix, functionUsed) {
        this.router.get(`${prefix}`, functionUsed.bind(this));
    }

    post(prefix, functionUsed) {
        this.router.post(`${prefix}`, functionUsed.bind(this));
    }

    put(prefix, functionUsed) {
        this.router.put(`${prefix}`, functionUsed.bind(this));
    }

    delete(prefix, functionUsed) {
        this.router.delete(`${prefix}`, functionUsed.bind(this));
    }

    patch(prefix, functionUsed) {
        this.router.patch(`${prefix}`, functionUsed.bind(this));
    }

    options(prefix, functionUsed) {
        this.router.options(`${prefix}`, functionUsed.bind(this));
    }

    head(prefix, functionUsed) {
        this.router.head(`${prefix}`, functionUsed.bind(this));
    }
}

module.exports = BaseController;