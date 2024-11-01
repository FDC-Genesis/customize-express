const app = require('./boot/start');
const path = require('path');
const fs = require('fs');

const adminRouter = require('../app/Admin/Route');
const userRouter = require('../app/User/Route');
const developerRouter = require('../app/Developer/Route');
const apiRoutes = require('./boot/start-api');

app.use('/admin', adminRouter);

app.use('/developer', developerRouter);

app.use('/', userRouter);

app.use('/api', apiRoutes);

app.get('/debug', (req, res) => {
    if (true) {
        return res.send(req.session.auth);
    }
});

module.exports = app;
