# 重构 

<br/> 

前面几节中，我们已经实现了项目中常见的几个操作：启动服务器、路由中间件、`Get` 和 `Post` 形式请求处理等。现在你已经迈出了成功的第一步。 

<br/> 

在整个示例中，目前所有的代码都写在 `app.js` 中，如果我们的业务代码增大，场景变得更复杂时候，这不论是对后期维护还是对患有强迫症的同学来讲都不是件好事情。那么我们要做的事情就是：『分梨』。 

<br/> 

## 分离 router

<br/> 

首先路由部分的代码，就可以单独分离成一个独立的 `router.js`，可以直接置于项目根目录，亦可独立到一个 `router` 文件夹存放，完全看喜好。这里，我们暂时放置于根目录，与 `app.js` 齐平。 

<br/> 

### 修改路由 router.js 

```js
  const router = require('koa-router')()

  module.exports = (app) => {
    router.get('/', async(ctx, next) => {
      ctx.response.body = `<h1>index page</h1>`
    })
    
    router.get('/home', async(ctx, next) => {
      console.log(ctx.request.query)
      console.log(ctx.request.querystring)
      ctx.response.body = '<h1>HOME page</h1>'
    })
    
    router.get('/home/:id/:name', async(ctx, next)=>{
      console.log(ctx.params)
      ctx.response.body = '<h1>HOME page /:id/:name</h1>'
    })
    
    router.get('/user', async(ctx, next)=>{
      ctx.response.body = 
      `
        <form action="/user/register" method="post">
          <input name="name" type="text" placeholder="请输入用户名：ikcamp"/> 
          <br/>
          <input name="password" type="text" placeholder="请输入密码：123456"/>
          <br/> 
          <button>GoGoGo</button>
        </form>
      `
    })
    
    // 增加响应表单请求的路由
    router.post('/user/register',async(ctx, next)=>{
      let {name, password} = ctx.request.body
      if( name == 'ikcamp' && password == '123456' ){
        ctx.response.body = `Hello， ${name}！` 
      }else{
        ctx.response.body = '账号信息错误'
      }
    })
    
    app.use(router.routes())
      .use(router.allowedMethods())
  }
``` 

<br/>

### 修改 app.js 

```js
  const Koa = require('koa')
  const bodyParser = require('koa-bodyparser')
  const app = new Koa()
  const router = require('./router')

  app.use(bodyParser())

  router(app)

  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
``` 

这样代码就看起来清爽了很多，这可以万事大吉了吧！ 

<br/> 

慢着！`router` 文件独立出来以后，应用的主文件 `app.js` 是会比较清爽，但是现在只有一个路由，并且处理函数也非常简单粗暴。那如果有 N 多的路由，每个处理函数都一堆，这样会不会被主管打死~~ 

<br/> 

好吧，如此看来还得继续优化结构才是。 

<br/> 

## 分离 controller 层 
> 这里，我们会把路由对应的业务逻辑分离出来。 

<br/> 

### 新增 controller/home.js 

<br/> 

新建 `controller` 文件夹，增加一个 `home.js` 文件，并从 `router.js` 中提取出业务逻辑代码。 

```js
  module.exports = {
    index: async(ctx, next) => {
      ctx.response.body = `<h1>index page</h1>`
    },
    home: async(ctx, next) => {
      console.log(ctx.request.query)
      console.log(ctx.request.querystring)
      ctx.response.body = '<h1>HOME page</h1>'
    },
    homeParams: async(ctx, next) => {
      console.log(ctx.params)
      ctx.response.body = '<h1>HOME page /:id/:name</h1>'
    },
    login: async(ctx, next) => {
      ctx.response.body =
        `
        <form action="/user/register" method="post">
          <input name="name" type="text" placeholder="请输入用户名：ikcamp"/> 
          <br/>
          <input name="password" type="text" placeholder="请输入密码：123456"/>
          <br/> 
          <button>GoGoGo</button>
        </form>
      `
    },
    register: async(ctx, next) => {
      let {
        name,
        password
      } = ctx.request.body
      if (name == 'ikcamp' && password == '123456') {
        ctx.response.body = `Hello， ${name}！`
      } else {
        ctx.response.body = '账号信息错误'
      }
    }
  }
``` 

<br/> 

### 修改路由 router.js 

<br/> 

修改 `router.js` 文件，在里面引入 `controler/home`： 

```js
  const router = require('koa-router')()
  const HomeController = require('./controller/home')
  module.exports = (app) => {
    router.get( '/', HomeController.index )
    
    router.get('/home', HomeController.home)
    
    router.get('/home/:id/:name', HomeController.homeParams)
    
    router.get('/user', HomeController.login)
    
    router.post('/user/register', HomeController.register)
    
    app.use(router.routes())
      .use(router.allowedMethods())
  }
``` 

<br/> 

如此分离之后，将每个路由的处理逻辑独立到 `controller` 中的独立文件，后期维护更加方便。 

<br/> 

目前的代码结构已经比较清晰了，适用于 `node` 作为中间层、中转层的项目。如果想要把 `node` 作为真正的后端，去操作数据库等，**建议**再分出一层 `service`。这样的话，`controller` 里面只做一些简单的参数处理，把数据层面的交互放在 `service` 层，比如调用 `model` 处理数据库，调用第三方接口等。 

<br/> 

## 分离 service 层 
> 这一层的分离，**可有可无**，要看自己的项目情况，如果想把代码逻辑都放在 `controller` 里面，也是可以的！ 

<br/> 

### 新建 service/home.js 

<br/> 

新建 `service` 文件夹，同样增加一个 `home.js` 文件，然后把 `controller/home.js` 中的部分代码抽离到 `service/home.js`： 

```js
  module.exports = {
    register: async(name, pwd) => {
      let data 
      if (name == 'ikcamp' && pwd == '123456') {
        data = `Hello， ${name}！`
      } else {
        data = '账号信息错误'
      }
      return data
    }
  }
``` 

<br/>

### 修改 controller/home.js 

```js
// 引入 service 文件
const HomeService = require('../service/home')
module.exports = {
  // ……省略上面代码
  // 重写 register 方法 
  register: async(ctx, next) => {
    let {
      name,
      password
    } = ctx.request.body
    let data = await HomeService.register(name, password)
    ctx.response.body = data
  }
}
``` 

<br/>

### **Yeah!!!重构完成** 

<br/> 

下一节中，我们将引入视图层 `views`，同时会引入第三方中间件来设置静态资源目录等。另外，我们会增加部分前端资源代码，让我们的用例更加生动。 