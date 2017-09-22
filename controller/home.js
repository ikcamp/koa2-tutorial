const HomeService = require("../service/home")
module.exports = {
  index: async function (ctx, next) {
    ctx.state.title = "欢迎进入iKcamp"
    await ctx.render("./home/index.html")
  },
  login: async function (ctx, next) {
    ctx.state.title = "请登录"
    await ctx.render("./home/login.html")
  },
  register: async function (ctx, next){
    let params = ctx.request.body
    let name = params.name
    let password = params.password
    let res = await HomeService.register(name,password)
    if(res.status == "-1"){
      await ctx.render("./home/login.html", res.data)
    }else{
      ctx.state.title = "个人中心"
      await ctx.render("./home/success.html",res.data)
    }
  }
}