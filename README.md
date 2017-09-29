# 路由 koa-router 
 > 上一节我们学习了中间件的基本概念，本节主要带大家学习下 `koa-router` 路由中间件的使用方法。 

<br/> 

路由是用于描述 `URL` 与处理函数之间的对应关系的。比如用户访问 `http://localhost:3000/`，那么浏览器就会显示 `index` 页面的内容，如果用户访问的是 `http://localhost:3000/home`，那么浏览器应该显示 `home` 页面的内容。 

<br/> 

要实现上述功能，如果不借助 `koa-router` 或者其他路由中间件，我们自己去处理路由，那么写法可能如下所示，我们修改 `app.js`： 

```js
  const Koa = require('koa')
  const app = new Koa()

  app.use(async (ctx, next) => {
    if (ctx.request.path === '/') {
        ctx.response.body = 'index page'
    } else {
        await next()
    }
  })
  app.use(async (ctx, next) => {
    if (ctx.request.path === '/home') {
        ctx.response.body = 'HOME page'
    } else {
        await next()
    }
  })
  app.use(async (ctx, next) => {
    if (ctx.request.path === '/404') {
        ctx.response.body = '404 Not Found'
    } else {
        await next()
    }
  })

  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
``` 

上述代码中，由 `async` 标记的函数称为异步函数，在异步函数中，可以用 `await` 调用另一个异步函数，这两个关键字将在 `ES7` 中引入。参数 `ctx` 是由 `koa` 传入的，封装了 `request` 和 `response` 的变量，我们可以通过它访问 `request` 和 `response`，`next` 是 `koa` 传入的将要处理的下一个异步函数。 

<br/> 

这样的写法虽然能够处理简单的应用，但是，一旦要处理的 `URL` 多起来就会显得特别笨重。所以我们可以借助 `koa-router` 来更简单的实现这一功能。 

<br/>

## 安装 koa-router 

<br/> 

通过 `npm` 命令直接安装： 

```js
npm install koa-router
``` 

<br/> 

## 使用方法 

<br/> 

在 `app.js` 中使用 `koa-router` 来处理 `URL`，代码如下： 

```js
  const Koa = require('koa')
  // 注意require('koa-router')返回的是函数:
  const router = require('koa-router')()
  const app = new Koa()

  // add url-route:
  router.get('/', async (ctx, next) => {
      ctx.response.body = `<h1>index page</h1>`
  })

  router.get('/home', async (ctx, next) => {
      ctx.response.body = '<h1>HOME page</h1>'
  })

  router.get('/404', async (ctx, next) => {
      ctx.response.body = '<h1>404 Not Found</h1>'
  })

  // add router middleware:
  app.use(router.routes())

  app.listen(3000, ()=>{
    console.log('server is running at http://localhost:3000')
  })
``` 

运行 `app.js`： 

```js
node app.js
``` 

<br/> 

在浏览器中访问 `http://localhost:3000` 

<div align="center">
  <img src="./images/index.png" width="640"/>
</div> 

<br/>

在浏览器中访问 `http://localhost:3000/home` 

<div align="center">
  <img src="./images/home.png" width="640"/>
</div> 

<br/>

在浏览器中访问 `http://localhost:3000/404` 

<div align="center">
  <img src="./images/404.png" width="640"/>
</div> 

<br/> 

当然，除了 `GET` 方法，`koa-router` 也支持处理其他请求方法，比如： 

```js
router
  .get('/', function (ctx, next) {
    ctx.body = 'Hello World!';
  })
  .post('/users', function (ctx, next) {
    // ... 
  })
  .put('/users/:id', function (ctx, next) {
    // ... 
  })
  .del('/users/:id', function (ctx, next) {
    // ... 
  })
  .all('/users/:id', function (ctx, next) {
    // ... 
  });
``` 

<br/> 

## 其他特性 

<br/> 

### 命名路由 

<br/>

我们可以为路由命名，这样，在开发过程中我们能够很方便的生成和重命名路由： 

```js
router.get('user', '/users/:id', function (ctx, next) {
 // ... 
});
 
router.url('user', 3);
// => "/users/3" 
``` 

<br/>

### 多中间件 

```js
  router.get(
    '/users/:id',
    function (ctx, next) {
      return User.findOne(ctx.params.id).then(function(user) {
        ctx.user = user;
        next();
      });
    },
    function (ctx) {
      console.log(ctx.user);
      // => { id: 17, name: "Alex" } 
    }
  );
``` 

<br/>

### 嵌套路由 

```js
  let forums = new Router();
  let posts = new Router();
  
  posts.get('/', function (ctx, next) {...});
  posts.get('/:pid', function (ctx, next) {...});
  forums.use('/forums/:fid/posts', posts.routes(), posts.allowedMethods());
  
  // responds to "/forums/123/posts" and "/forums/123/posts/123" 
  app.use(forums.routes());
``` 

<br/> 

### 路由前缀 

```js
  let router = new Router({
    prefix: '/users'
  });
  
  router.get('/', ...); // responds to "/users" 
  router.get('/:id', ...); // responds to "/users/:id" 
```

<br/> 

下一节，我们将讲述下项目中常见的几种请求写法及参数解析。


