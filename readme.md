## Koa 起手 

<br> 

### 准备工作
> 身为程序员，第一招必是『Hello World』。 

<br> 

首先，创建一个目录 `koa2-tutorial/` 用来存放我们的代码，然后进入到你创建的目录里面，新建文件 `app.js` 并在里面写下： 

```js
console.log('Hello World')
``` 

<br>

然后在 `koa2-tutorial/` 目录下运行 `app.js`：

```js
node app.js
```

成功看到输出 `Hello World`，说明环境很安全。 

** 注意：** 请保证 `node` 环境在 `7.6` 版本以上(`Koa2` 需要应用 `async/await` 等新语法)。 

<br> 

然后，新建 `package.json` 文件来管理项目中用到一些安装包。在当前目录下运行： 

```js
npm init
``` 

一路默认后，项目结构应该如下： 

```txt
├── app.js
├── package.json
``` 

<br>

下面我们会基于 `Koa2` 启动服务器。

<br>

### 启动服务器 

运行如下命令，安装 `Koa`(版本信息会自动保存在 `package.json` 中) 

```js
npm install koa
```

<br>  

重写 `app.js`，增加如下代码： 

```js
const Koa = require('koa')
const app = new Koa()

app.listen(3000)
console.log(`app started at port 3000...`);
``` 

运行 `node app.js` 并打开浏览器访问 `localhost:3000`，页面显示 `Not Found`。 

因为在启动服务器后，代码并没有做其他的事情，也就没有了交互。

我们继续修改 `app.js` 文件： 

```js
const Koa = require('koa')
const app = new Koa()

// 增加代码
app.use(async (ctx, next) => {
  await next()
  ctx.response.type = 'text/html'
  ctx.response.body = '<h1>Hello World</h1>'
})

app.listen(3000, () => {
  console.log('server is running at http://0.0.0.0:3000')
})
``` 

重启服务器并再次访问，页面将正常显示 `Hello World`。 

<br>  

我们增加的代码里面，用到了 `Koa` 的中间件，下面我们讲述下中间件的用法。

<br>

### 中间件 
> 正是因为中间件的扩展性才使得 `Koa` 的代码简单灵活。 

<br> 

我们先看下这段代码： 

```js
app.use(async (ctx, next)=>{
  await next()
  ctx.response.type = 'text/html'
  ctx.response.body = '<h1>Hello World</h1>'  
})
``` 

每收到一个 `http` 请求，`Koa` 都会调用通过 `app.use()` 注册的 `async` 函数，并传入了两个参数 `ctx` 和 `next`。 

<br> 

* `ctx` 

<br> 

`ctx` 作为上下文使用，包含了基本的 `ctx.request` 和 `ctx.response`。另外，`Koa` 内部对一些常用的属性或者方法做了代理操作，使得我们可以直接通过 `ctx` 获取。比如，`ctx.request.url` 可以写成 `ctx.url`。 

<br> 

除此之处，`Koa` 还约定了一个中间件的存储空间 `ctx.state`，通过 `state` 可以存储一些数据，比如用户数据，版本信息等。如果你使用 `webpack` 打包的话，可以使用中间件将加载资源的方法作为 `ctx.state` 的属性传入到 `view` 层，方便获取资源路径。

<br> 

* `next` 

<br>

`next` 参数的作用，是将处理的控制权转交给下一个中间件，而 `next()` 后面的代码，将会在下一个中间件及后面的中间件(如果有的话)执行结束后再执行。 

** 注意：** 中间件的顺序很重要！ 
 
<br>  

我们重写 `app.js` 来解释下中间件的流转过程： 

```js
// 按照官方示例
const Koa = require('koa')
const app = new Koa()

// 记录执行的时间
app.use(async (ctx, next)=>{
  let stime = new Date().getTime()
  await next()
  let etime = new Date().getTIme()
  ctx.response.type = 'text/html'
  ctx.response.body = '<h1>Hello World</h1>'
  console.log(`请求地址: ${ctx.path}，响应时间：${etime - stime}ms`)
});

app.use(async (ctx, next) => {
  console.log('中间件1 doSoming')
  await next();
  console.log('中间件1 end')
})

app.use(async (ctx, next) => {
  console.log('中间件2 doSoming')
  await next();
  console.log('中间件2 end')
})

app.use(async (ctx, next) => {
  console.log('中间件3 doSoming')
  await next();
  console.log('中间件3 end')
})

app.listen(3000, () => {
  console.log('server is running at http://0.0.0.0:3000')
})
``` 

<br> 

运行起来后，控制台显示： 

```txt
server is running at http://0.0.0.0:3000
``` 

<br> 

然后打开浏览器，访问 `http://0.0.0.0:3000`，控制台显示内容更新为： 

```txt
server is running at http://0.0.0.0:3000
中间件1 doSoming
中间件2 doSoming
中间件3 doSoming
中间件3 end
中间件2 end
中间件1 end
请求地址: /，响应时间：2ms
```

从结果上可以看到，流程是一层层的打开，然后一层层的闭合，像是剥洋葱一样 —— 洋葱模型。

<br> 

此外，如果一个中间件没有调用 `await next()`，会怎样呢？答案是『后面的中间件将不会执行』。 

<br> 

下一节中，我们将学习下如何响应浏览器的各种请求。 



