const Controller = require('../../Controller.js');

class PaymentsController extends Controller {
  constructor() {
    super();
    this.set('title', 'Payments');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('bearer');
    this.get('/', this.getPayments);
  }

  getPayments(req, res) {
    res.json({ message: 'Authenticated', data: req.bearerAuth().user() });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new PaymentsController().getRouter();
