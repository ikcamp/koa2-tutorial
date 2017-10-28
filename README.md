# 规范与部署 
> 懒人推动社会进步。 

<br/>

本篇中，我们会讲述三个知识点 

- 定制书写规范 
- 开发环境运行 
- 如何部署运行 

<br/>

## 定制书写规范
> 文中所说的书写规范，仅供参考，非项目必需。

<br/>

随着 `Node` 流行，`JavaScript` 编码规范已经相当成熟，社区也产生了各种各样的编码规范。但是在这里，我们要做的不是『限制空格的数量』，也不是『要不要加分号』。我们想要说的规范，是项目结构的规范。

<br/> 

目前我们的项目结构如下： 

```txt
├─ controller/          // 用于解析用户的输入，处理后返回相应的结果
├─ service/             // 用于编写业务逻辑层，比如连接数据库，调用第三方接口等
├─ errorPage/           // http 请求错误时候，对应的错误响应页面
├─ logs/                // 项目运用中产生的日志数据
├─ middleware/          // 中间件集中地，用于编写中间件，并集中调用
│  ├─ mi-http-error/
│  ├─ mi-log/
│  ├─ mi-send/
│  └── index.js
├─ public/              // 用于放置静态资源
├─ views/               // 用于放置模板文件，返回客户端的视图层
├─ router.js            // 配置 URL 路由规则
└─ app.js               // 用于自定义启动时的初始化工作，比如启动 https，调用中间件，启动路由等
```

<br/>

当架构师准备好项目结构后，开发人员只需要修改业务层面的代码即可，比如当我们增加一个业务场景时候，我们大概需要修改三个地方： 

1. `service/` 目录下新建文件，处理逻辑层的业务代码，并返回给 `controller` 层
2. `controller/` 目录下新建文件，简单处理下请求数据后，传递给 `service`
3. 修改路由文件 `router.js`，增加路由对应的处理器 

<br/>

随着业务量的增大，我们就会发现有一个重复性的操作——『不断的 `require` 文件，不断的解析文件中的函数』。当业务量达到一定程度时候，可能一个文件里面要额外引入十几个外部文件： 

```js
const controller1 = require('...')
const controller2 = require('...')
const controller3 = require('...')
const controller4 = require('...')
...
app.get('/fn1', controller1.fn1() )
app.get('/fn2', controller2.fn2() )
app.get('/fn3', controller3.fn3() )
app.get('/fn4', controller4.fn4() )
```

单是起名字就已经够头疼的！ 

<br/>

所以，我们要做的事情就是，约定代码结构规范，省去这些头疼的事情，比如 `router.js`： 

```js
// const router = require('koa-router')()
// const HomeController = require('./controller/home')
// module.exports = (app) => {
//   router.get( '/', HomeController.index )
//   router.get('/home', HomeController.home)
//   router.get('/home/:id/:name', HomeController.homeParams)
//   router.get('/user', HomeController.login)
//   router.post('/user/register', HomeController.register)
//   app.use(router.routes())
//      .use(router.allowedMethods())
// }
const router = require('koa-router')()
module.exports = (app) => {
  router.get( '/', app.controller.home.index )
  router.get('/home', app.controller.home.home)
  router.get('/home/:id/:name', app.controller.home.homeParams)
  router.get('/user', app.controller.home.login)
  router.post('/user/register', app.controller.home.register)
  app.use(router.routes())
     .use(router.allowedMethods())
}
``` 

聪明的同学可能已经发现了，`app.controller.home.index` 其实就是 `cotroller/home.js` 中的 `index` 函数。 

<br/>

### 设计思路 

实现思路很简单，当应用程序启动时候，读取指定目录下的 `js` 文件，以文件名作为属性名，挂载在实例 `app` 上，然后把文件中的接口函数，扩展到文件对象上。 

一般有两种方式入手，一种是程序启动时候去执行，另外一种是请求过来时候再去读取。 

而在传统书写方式中，项目启动时候会根据 `require` 加载指定目录文件，然后缓存起来，其思路与第一种方式一致。如果以中间件的方式，在请求过来时候再去读取，则第一次读取肯定会相对慢一起。综合考虑，我们采用了第一种方式：程序启动时候读取。

<br/>

### 代码实现

新建目录文件 `middleware/mi-rule/index.js`， 实现代码如下： 

```js
const Path = require("path");
const fs = require('fs');
module.exports = function (opts) {
  let { app, rules = []} = opts

  // 如果参数缺少实例 app，则抛出错误
  if (!app) {
    throw new Error("the app params is necessary!")
  }
  // 提取出 app 实例对象中的属性名
  const appKeys = Object.keys(app)
  rules.forEach((item) => {
    let { path, name} = item
    // 如果 app 实例中已经存在了传入过来的属性名，则抛出错误
    if (appKeys.includes(name)) {
      throw new Error(`the name of ${name} already exists!`)
    }
    let content = {};
    //读取指定文件夹下(dir)的所有文件并遍历
    fs.readdirSync(path).forEach(filename => {
      //取出文件的后缀
      let extname = Path.extname(filename);
      //只处理js文件
      if (extname === '.js') {
        //将文件名中去掉后缀
        let name = Path.basename(filename, extname);
        //读取文件中的内容并赋值绑定
        content[name] = require(Path.join(path, filename));
      }
    });
    app[name] = content
  })
}
```

`opts` 是参数对象，里面包含了实例 `app`，用来挂载指定的目录文件。`rules` 是我们指定的目录规则。 

用法如下，修改 `middleware/index.js`：

```js
// 引入规则中件间
const miRule = require('./mi-rule')

module.exports = (app) => {
  /**
   * 在接口的开头调用
   * 指定 controller 文件夹下的 js 文件，挂载在 app.controller 属性
   * 指定 service 文件夹下的 js 文件，挂载在 app.service 属性
   */ 
  miRule({
    app,
    rules: [
      {
        path: path.join(__dirname, '../controller'),
        name: 'controller'
      },
      {
        path: path.join(__dirname, '../service'),
        name: 'service'
      }
    ]
  })

  // 以下代码省略
}
``` 

<br/>

### 业务代码应用 

#### 1. 修改 `router.js`： 

```js
const router = require('koa-router')()
module.exports = (app) => {
  router.get( '/', app.controller.home.index )
  router.get('/home', app.controller.home.home)
  router.get('/home/:id/:name', app.controller.home.homeParams)
  router.get('/user', app.controller.home.login)
  router.post('/user/register', app.controller.home.register)
  app.use(router.routes()).use(router.allowedMethods())
}
``` 

#### 2. 修改 `controller/home.js`： 

```js
module.exports = {
  index: async(ctx, next) => {
    await ctx.render("home/index", {title: "iKcamp欢迎您"})
  },
  home: async(ctx, next) => {
    ctx.response.body = '<h1>HOME page</h1>'
  },
  homeParams: async(ctx, next) => {
    ctx.response.body = '<h1>HOME page /:id/:name</h1>'
  },
  login: async(ctx, next) => {
    await ctx.render('home/login', {
      btnName: 'GoGoGo'
    })
  },
  register: async(ctx, next) => {
    // 解构出 app 实例对象
    const { app } = ctx

    let params = ctx.request.body
    let name = params.name
    let password = params.password

    // 留意 service 层的调用方式
    let res = await app.service.home.register(name,password)
    if(res.status == "-1"){
      await ctx.render("home/login", res.data)
    }else{
      ctx.state.title = "个人中心"
      await ctx.render("home/success", res.data)
    }
  }
}
``` 

项目中引入这个结构规范，并不是必须的，毕竟大家的想法不一样。`iKcamp` 团队在提出此想法时候，也是有不少分歧。提出这样一个思路，仅供大家参考。

<br/>

## 开发环境运行 

作为后端代码语言，开发环境中每次修改文件，都需要手动的重启应用，不能像前端浏览器那样清爽。为了减轻手工重启的成本，我们建议采用 `nodemon` 来代替 `node` 以启动应用。当代码发生变化时候，`nodemon` 会帮我们自动重启。 

<br/>

全局安装 `nodemon`： 

```js
npm i nodemon -g
``` 

<br/>

本地项目中也需要安装： 

```js
npm i nodemon -S
```

<br/>

更多细节用法，请查阅[官方文档](https://github.com/remy/nodemon#nodemon) 

<br/>

## 部署运行 

<br/>

线上部署运行的话，方法也有很多，我们推荐使用 `pm2`。 
 
`pm2` 是一个带有负载均衡功能的Node应用的进程管理器。

<br/>

安装方法与 `nodemon` 相似，需要全局安装：

```js
npm i pm2 -g
``` 

<br/>

运行方法： 

```js
pm2 start app.js
``` 

<br/>

更多细节用法，请查阅[官方文档](http://pm2.keymetrics.io/docs/usage/quick-start/)
