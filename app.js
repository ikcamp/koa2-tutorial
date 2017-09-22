const Koa = require('koa')
const app = new Koa()
const views = require("koa-views")
const nunjucks = require('nunjucks')
const path = require("path")
const staticFiles = require('koa-static')
const Router = require('koa-router')()
const BodyParser = require('koa-bodyparser')
const router = require("./route")

const nunjucksEnvironment = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, './views'))
)
// app.use(async (ctx,next)=>{
//   ctx.state = {
//     title: "ikcamp",
//     __sourceMap(path){
//       return path
//     }
//   }
//   await next()
// })
app.use(views(path.join(__dirname, '/views'), {
  options: {
    nunjucksEnv: nunjucksEnvironment
  },
  map: {
    html: "nunjucks"
  }
}))
app.use(staticFiles(path.resolve(__dirname, "./public")))

app.use(BodyParser())
app.use(Router.routes()).use(Router.allowedMethods())
router(Router)

app.listen(3000)
console.log(`app started at port 3000...`);