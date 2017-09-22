module.exports = {
  index: async function (scope) {
    Object.assign(scope, {title: "iKcamp"})
    await this.render("index")
  },
  login: async function (scope) {
    Object.assign(scope, {title: "请登录"})
    await this.render("login")
  },
  register: async function (scope){
    let params = this.request.body
    let name = params.name
    let password = params.password
    let res = await this.service.home.register(name,password)
    Object.assign(scope, res.data)
    if(res.status == "-1"){
      await this.render("login")
    }else{
      await this.render("success")
    }
  }
}