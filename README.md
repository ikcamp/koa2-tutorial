# 增加 JSON 数据 
> 我颠倒了整个世界，只为摆正你的倒影。 

<br/>

前面的文章中，我们已经完成了项目中常见的问题，比如 `路由请求`、`结构分层`、`视图渲染`、`静态资源`等。 
那么，`json` 呢？`json` 格式数据的传输，已经深入到了我们的码里行间，脱离了 `json` 的人想必是痛苦的。那么，复合吧！ 


<div align="center">
  <img src="./images/p972291133.jpg"/>
</div> 

<br/>

## 如何设置 JSON 格式 

<br/>

伟大的武术家——李小龙先生——说过这样一段话： 

```txt
Empty your mind, Be formless,shapeless like water. 
You put water in a cup, it becomes the cup.
You put water in a bottle, it becomes the bottle. 
You put water in a teapot , it becomes the teapot. 
Water can flow or crash. 
``` 

<br/> 

翻译成中文意思就是： 

```txt
清空你的思想，像水一样无形。
你将水倒入水杯，水就是水杯的形状。
你将水倒入瓶子，水就是瓶子的形状。
你将水倒入茶壶，水就是茶壶的形状。
你看，水会流动，也会冲击。
```

<br/>

在数据传输过程中，传输的资源都可以称之为『数据』，而『数据』之所以展示出不同的形态，是因为我们已经设置了它的格式。 

<br/> 

传输的数据像是『水』一样，没有任何的格式和形状。 
我们的设置像是『器』一样，赋予它指定的形态。 

<br/> 

所以，我们只需要设置把数据挂载在响应体 `body` 上，同时告诉客户端『返回的是 `JSON` 数据』，客户端就会按照 `JSON` 来解析了。代码如下： 

```js
ctx.set("Content-Type", "application/json")
ctx.body = JSON.stringify(json)
```

<br/> 

## 提取中间件 

<br/> 

我们把上面的代码提取出来一个中间件，这样更方便代码的维护性和扩展性 

<br/> 

增加文件 `/middleware/mi-send/index.js`：

```js
module.exports = () => {
  function render(json) {
      this.set("Content-Type", "application/json")
      this.body = JSON.stringify(json)
  }
  return async (ctx, next) => {
      ctx.send = render.bind(ctx)
      await next()
  }
}
``` 

**注意：**目录不存在，需要自己创建。 

<br/> 

代码中，我们把 `JSON` 数据的处理方法挂载在 `ctx` 对象中，并起名为 `send`。当我们需要返回 `JSON` 数据给客户端时候，只需要调用此方法，并把 `JSON` 对象作为参数传入到方法中就行了，用法如下： 

```js
ctx.send({
  status: 'success',
  data: 'hello ikcmap'
})
``` 

<br/> 

## 应用中间件 

代码的实现过程和调用方法我们已经知道了，现在我们需要把这个中间件应用在项目中。

<br/> 

1. 增加文件 `middleware/index.js`，用来集中调用所有的中间件： 

```js
const miSend = require('./mi-send')
module.exports = (app) => {
  app.use(miSend())
}
``` 

<br/> 

2. 修改 `app.js`，增加中间件的引用 

```js
const Koa = require('koa')
const path = require('path')
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
// 引入 koa-static
const staticFiles = require('koa-static')

const app = new Koa()
const router = require('./router')

const middleware = require('./middleware')

middleware(app)

// 指定 public目录为静态资源目录，用来存放 js css images 等
app.use(staticFiles(path.resolve(__dirname, "./public")))

app.use(nunjucks({
  ext: 'html',
  path: path.join(__dirname, 'views'),
  nunjucksConfig: {
    trimBlocks: true
  }
}));

app.use(bodyParser())
router(app)
app.listen(3000, () => {
  console.log('server is running at http://localhost:3000')
})
``` 

<br/> 

## 中间件迁移 

随着项目的步步完善，将会产生有更多的中间件。我们把 `app.js` 中的中间件代码迁移到 `middleware/index.js` 中，方便后期维护扩展 

<br/> 

1. 修改 `app.js` 

```js
const Koa = require('koa')
const app = new Koa()
const router = require('./router')

const middleware = require('./middleware')

middleware(app)
router(app)
app.listen(3000, () => {
  console.log('server is running at http://localhost:3000')
})
``` 

<br/> 

2. 修改 `middleware/index.js` 

```js
const path = require('path')
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')

const miSend = require('./mi-send')
module.exports = (app) => {
  app.use(staticFiles(path.resolve(__dirname, "../public")))

  app.use(nunjucks({
    ext: 'html',
    path: path.join(__dirname, '../views'),
    nunjucksConfig: {
      trimBlocks: true
    }
  }));

  app.use(bodyParser())
  app.use(miSend())
}
``` 

<br/> 

后面我们还会开发更多的中间件，比如日志记录、错误处理等，都会放在 `middleware/` 目录下处理。









