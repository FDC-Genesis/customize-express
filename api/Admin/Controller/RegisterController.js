const Validator = require('../../../libs/Middleware/Validator');
const Hash = require('../../../libs/Service/Hash');
const Controller = require('../Controller');

class RegisterController extends Controller {
  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.post('/', this.postRegister);
  }

  async postRegister(req, res) {
    const validate = await Validator.make(req.body, {
      username: "required|unique:admins",
      email: "required|email|unique:admins",
      password: "required|confirmed",
    });
    let fail = validate.fails();

    // Check for validation failures
    if (fail) {
      return res.status(403).json({ error: validate.errors, old: validate.old });
    }
    let data = this.only(req.body, ["username", "email", "password"]);
    data.password = Hash.make(data.password);
    // Model
    let adminID = await this.Admin.create(data);
    if (adminID) {
      if (await this.Admin.createSecret(adminID)) {
        let mailer = new this.mailer();
        await mailer.sendMail({
          to: data.email,
          subject: "Welcome",
          header: "Account created successfully.",
          content: "This is an example mailer."
        });
        return res.status(201).json({ error: false, message: `Admin created successfully.` });
      } else {
        await this.Admin.delete(adminID);
        return res.status(403).json({ error: true, message: `Admin secret not created.`, old: req.body });
      }
    }
    return res.status(404).json({ error: true, message: `Admin not created.` });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new RegisterController().getRouter();
