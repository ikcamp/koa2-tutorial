# 重构 

<br/> 

在前面几节中，我们已经实现了项目中的几个常见操作：启动服务器、路由中间件、`Get` 和 `Post` 形式的请求处理等。现在你已经迈出了走向成功的第一步。 

<br/> 

目前，整个示例中所有的代码都写在 `app.js` 中。然而在业务代码持续增大，场景更加复杂的情况下，这种做法无论是对后期维护还是对患有强迫症的同学来说都不是好事。所以我们现在要做的就是：『分梨』。 

<br/> 

## 分离 router

<br/> 

路由部分的代码可以分离成一个独立的文件，并根据个人喜好放置于项目根目录下，或独立放置于 `router` 文件夹中。在这里，我们将它命名为 `router.js`并将之放置于根目录下。 

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

代码看起来清爽了很多。

<br/> 

然而到了这一步，还是不能够高枕无忧。`router` 文件独立出来以后，应用的主文件 `app.js` 虽然暂时看起来比较清爽，但这是在只有一个路由，并且处理函数也非常简单的情况下。如果有多个路由，每个处理函数函数代码量也都繁复可观，这就不是主管们喜闻乐见的事情了。

<br/> 

接下来我们对结构进行进一步优化。

<br/> 

## 分离 controller 层 
> 我们把路由对应的业务逻辑也分离出来。 

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

如此，将每个路由的处理逻辑分离到 `controller` 下的独立文件当中，便于后期维护。 

<br/> 

目前的代码结构已经比较清晰了，适用于以 `node` 作为中间层、中转层的项目。如果想要把 `node` 作为真正的后端去操作数据库等，**建议**再分出一层 `service`，用于处理数据层面的交互，比如调用 `model` 处理数据库，调用第三方接口等，而`controller` 里面只做一些简单的参数处理。 

<br/> 

## 分离 service 层 
> 这一层的分离，**非必需**，可以根据项目情况适当增加，或者把所有的业务逻辑都放置于 `controller` 当中。 

<br/> 

### 新建 service/home.js 

<br/> 

新建 `service` 文件夹，并于该文件夹下新增一个 `home.js` 文件，用于抽离 `controller/home.js` 中的部分代码： 

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

### **重构完成** 

<br/> 

下一节我们将引入视图层 `views`，还会介绍使用第三方中间件来设置静态资源目录等。新增的部分前端资源代码会让我们的用例更加生动，尽情期待吧。 
