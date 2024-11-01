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
      username: "required|unique:users",
      email: "required|email|unique:users",
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
    let userID = await this.User.create(data);
    if (userID) {
      if (await this.User.createSecret(userID)) {
        let mailer = new this.mailer();
        await mailer.sendMail({
          to: data.email,
          subject: "Welcome",
          header: "Account created successfully.",
          content: "This is an example mailer."
        });
        return res.status(201).json({ error: false, message: `User created successfully.` });
      } else {
        await this.User.delete(userID);
        return res.status(403).json({ error: true, message: `User secret not created.`, old: req.body });
      }
    }
    return res.status(404).json({ error: true, message: `User not created.` });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new RegisterController().getRouter();
