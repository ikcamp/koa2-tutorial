module.exports = [
  {
    match: "/",
    controller: "home.index"
  },
  {
    match: "/user",
    controller: "home.login"
  },
  {
    match: "/user/register",
    controller: "home.register",
    method: "post"
  }
]