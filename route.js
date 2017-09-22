const HomeController = require("./controller/home")
module.exports = (app) => {
  app.get("/", HomeController.index)
  app.get("/user", HomeController.login)
  app.post("/user/register", HomeController.register)
}