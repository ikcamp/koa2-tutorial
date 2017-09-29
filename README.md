# 处理 POST/GET 请求 
 > 在学习了 `Router` 之后，我们就可以用它来处理 `POST/GET` 请求。 

<br/> 

`koa-router` 提供了 `.get`、`.post`、`.put` 和 `.del` 接口来处理各种请求，但实际业务上，我们大部分只会接触到 `POST` 和 `GET`，所以接下来只针对这两种请求类型来说明。 

<br/> 

## Get 请求 

<br/>

当我们捕获到 `Get` 请求后，一般都需要解析出来请求带过来的数据。数据传递过来的方式一般有两种： 

<br/> 

### 1. 请求参数放在 `URL` 后面  

```txt
http://localhost:3000/home?id=12&name=ikcamp
``` 

<br/>

`koa-router` 封装的 `request` 对象，里面的 `query` 方法或 `querystring` 方法可以直接获取到 `Get` 请求的数据，唯一不同的是 `query` 返回的是对象，而 `querystring` 返回的是字符串。 

修改 `app.js`，我们加入解析方式： 

```js
  const Koa = require('koa')
  const router = require('koa-router')()
  const app = new Koa()

  router.get('/', async(ctx, next) => {
    ctx.response.body = `<h1>index page</h1>`
  })

  router.get('/home', async(ctx, next) => {
    console.log(ctx.request.query)
    console.log(ctx.request.querystring)
    ctx.response.body = '<h1>HOME page</h1>'
  })

  router.get('/404', async(ctx, next) => {
    ctx.response.body = '<h1>404 Not Found</h1>'
  })

  // add router middleware:
  app.use(router.routes())

  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
``` 

<br/>

运行代码，并通过浏览器访问，这时候我们查看控制台显示： 

```txt
// 浏览器打开访问 http://localhost:3000/home?id=12&name=ikcamp

{ id: '12', name: 'ikcamp' }
id=12&name=ikcamp
``` 

<br/> 

### 2. 请求参数放在 `URL` 中间 

```txt
http://localhost:3000/home/12/ikcamp
``` 

<br/>

这种情况下，解析方式肯定与上面的不一样了，`koa-router` 会把请求参数解析在 `params` 对象上，我们修改 `app.js` 文件，增加新的路由来测试下： 

```js
  // 增加如下代码
  router.get('/home/:id/:name', async(ctx, next)=>{
    console.log(ctx.params)
    ctx.response.body = '<h1>HOME page /:id/:name</h1>'
  })
``` 

<br/> 

运行代码，并通过浏览器访问，然后查看下控制台显示的日志信息： 

```txt
// 请求地址 http://localhost:3000/home/12/ikcamp 
{ id: '12', name: 'ikcamp' } 
``` 

<br/>

##  Post 请求 

<br/>

当用 `post` 方式请求时，我们会遇到一个问题：`post` 请求通常都会通过表单或 `JSON` 形式发送，而无论是 `Node` 还是 `Koa`，都 **没有提供** 解析 `post` 请求参数的功能。 

<br/> 

### koa-bodyparser 说：『是时候登场了！』。 

<br/> 

首先，安装 `koa-bodyparser` 包： 

```js
npm install koa-bodyparser
``` 

<br/> 

安装完成之后，我们需要在 `app.js` 中引入中间件并应用： 

```js
  const Koa = require('koa')
  const router = require('koa-router')()
  const bodyParser = require('koa-bodyparser')
  const app = new Koa()

  app.use(bodyParser())

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

  router.get('/404', async(ctx, next) => {
    ctx.response.body = '<h1>404 Not Found</h1>'
  })

  app.use(router.routes())

  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
```

然后我们来试着写一个简单的表单提交实例

<br/>

修改 `app.js` 增加如下代码，实现增加表单页面的路由：

```js
  // 增加返回表单页面的路由
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
``` 

<br/>

修改 `app.js` 增加如下代码，实现 `post` 表单提交对应的路由： 

```js
  // 增加响应表单请求的路由
  router.post('/user/register',async(ctx, next)=>{
    let {name, password} = ctx.request.body
    if( name == 'ikcamp' && password == '123456' ){
      ctx.response.body = `Hello， ${name}！`
    }else{
      ctx.response.body = '账号信息错误'
    }
  })
```

<br/> 

常见的 `get` 和 `post` 请求，以及相应的参数传递解析，我们已经学习过了。下一节中，我们会把项目整理重构下，做个分层，并引入视图层。
