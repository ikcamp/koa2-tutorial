# middleware 中间件 
> 正是因为中间件的扩展性才使得 `Koa` 的代码简单灵活。 

<br> 

在 `app.js` 中，有这样一段代码： 

```js
app.use(async (ctx, next)=>{
  await next()
  ctx.response.type = 'text/html'
  ctx.response.body = '<h1>Hello World</h1>'  
})
``` 

它的作用是：每收到一个 `http` 请求，`Koa` 都会调用通过 `app.use()` 注册的 `async` 函数，并传入了两个参数 `ctx` 和 `next`。 

<br> 

## <a>&sect; ctx 作用</a> 

<br> 

`ctx` 作为上下文使用，包含了基本的 `ctx.request` 和 `ctx.response`。另外，`Koa` 内部对一些常用的属性或者方法做了代理操作，使得我们可以直接通过 `ctx` 获取。比如，`ctx.request.url` 可以写成 `ctx.url`。 

<br> 

除此之处，`Koa` 还约定了一个中间件的存储空间 `ctx.state`，通过 `state` 可以存储一些数据，比如用户数据，版本信息等。如果你使用 `webpack` 打包的话，可以使用中间件将加载资源的方法作为 `ctx.state` 的属性传入到 `view` 层，方便获取资源路径。

<br> 

## <a>&sect; next 作用</a> 

<br>

`next` 参数的作用，是将处理的控制权转交给下一个中间件，而 `next()` 后面的代码，将会在下一个中间件及后面的中间件(如果有的话)执行结束后再执行。 

**注意：** 中间件的顺序很重要！ 
 
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
  let etime = new Date().getTime()
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
  console.log('server is running at http://localhost:3000')
})
``` 

<br> 

运行起来后，控制台显示： 

```txt
server is running at http://localhost:3000
``` 

<br> 

然后打开浏览器，访问 `http://localhost:3000`，控制台显示内容更新为： 

```txt
server is running at http://localhost:3000
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

修改 `app.js` 如下，我们去掉了第三个中间件里面的 `await`： 

```js
const Koa = require('koa')
const app = new Koa()

// 记录执行的时间
app.use(async (ctx, next)=>{
  let stime = new Date().getTime()
  await next()
  let etime = new Date().getTime()
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
  // 注意，这里我们删掉了 next
  // await next()
  console.log('中间件2 end')
})

app.use(async (ctx, next) => {
  console.log('中间件3 doSoming')
  await next();
  console.log('中间件3 end')
})

app.listen(3000, () => {
  console.log('server is running at http://localhost:3000')
})
```

<br>

重新运行代码后，控制台显示如下： 

```txt
server is running at http://localhost:3000
中间件1 doSoming
中间件2 doSoming
中间件2 end
中间件1 end
请求地址: /，响应时间：1ms
``` 

<br> 

与我们的预期结果『后面的中间件将不会执行』是一致的。 

<br>

下一节中，我们将学习下如何响应浏览器的各种请求。 



