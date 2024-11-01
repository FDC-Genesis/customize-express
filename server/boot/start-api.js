const express = require('express');
const router = express.Router();

const adminApiRouter = require('../../api/Admin/Route');
const userApiRouter = require('../../api/User/Route');
const developerApiRouter = require('../../api/Developer/Route');

router.use('/admin', adminApiRouter);
router.use('/user', userApiRouter);
router.use('/developer', developerApiRouter);

module.exports = router;