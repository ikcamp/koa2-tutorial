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

app.listen(3000, () => {
  console.log('server is running at http://localhost:3000')
})