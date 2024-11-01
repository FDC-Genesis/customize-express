const Controller = require('../Controller');

class HomeController extends Controller {
  constructor() {
    super();
    this.set('title', 'Home');
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.middleware('bearer');
    this.router.get('/', this.getHome.bind(this));
  }

  getHome(req, res) {
    res.json({ message: 'this is Admin' });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new HomeController().getRouter();
