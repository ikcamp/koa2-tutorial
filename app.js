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
  console.log('server is running at http://0.0.0.0:3000')
})