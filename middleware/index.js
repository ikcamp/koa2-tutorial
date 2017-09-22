const Router = require('koa-router')()
const path = require("path")
const favicon = require('koa-favicon')
const BodyParser = require('koa-bodyparser')
const ip = require("ip")
const staticFiles = require('koa-static')



const miInit = require('./mi-init')
const miRender = require('./mi-render')
const miRenderJson = require('./mi-render/send')
const miRouter = require('./mi-router')
const miService = require('./mi-service')
const miLog = require('./mi-log')
const miHttpError = require('./mi-http-error')
const miCsrf = require('./mi-csrf-dev')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = (app) => {

  app.use(miHttpError({
    errorPageFolder: path.resolve(__dirname, '../errorPage') // 自定义错误文件夹
  }));
  
  /**
   * 记录URL以及页面执行时间
   */
  app.use(async (ctx, next) => {
    let start = Date.now()
    await next()
    let delta = Date.now() - start
    ctx.log && ctx.log.info({
      responseTime: delta
    })
  })

  /**
   * 初始化log
   */
  app.use(miLog(app.env, {
    env: app.env,
    category: 'xxxxx',
    projectName: 'node-tutorial',
    appLogLevel: 'debug',
    dir: 'logs',
    serverIp: ip.address()
  }));

  /**
   * 初始化模板上下文 scope
   */
  app.use(miInit())

  /**
   * 初始化service
   */
  app.use(miService(path.resolve(__dirname, '../service')))

  /**
   * 处理静态文件
   */
  app.use(staticFiles(path.resolve(__dirname, "../public")))
  app.use(favicon(path.resolve(__dirname, "../public/favicon.ico"))) 

  

  /**
   * 解析POST请求
   */
  app.use(BodyParser())

  app.use(miRender({
    rootControllerPath: path.resolve(__dirname, "../controller"),
    viewRootPath: path.resolve(__dirname, "../views")
  }))

  app.use(miRenderJson())

  app.use(miRouter(require("../route")))

  if(!isProduction){
    app.use(miCsrf())
  }
  /**
   * 监听应用挂掉的错误处理
   */ 
  app.on("error", (err, ctx) => {
    if (ctx && !ctx.headerSent && ctx.status < 500) {
      ctx.status = 500
    }
    if (ctx && ctx.log && ctx.log.error) {
      if (!ctx.state.logged) {
        ctx.log.error(err.stack)
      }
    }
  })
}