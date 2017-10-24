const log4js = require('log4js');
const path = require("path");
const access = require("./access.js");
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

// 提取默认公用参数对象
const baseInfo = {
  appLogLevel: 'debug',
  dir: 'logs',
  env: 'dev',
  projectName: 'koa2-tutorial',
  serverIp: '0.0.0.0'
}

// 提取变量为参数对象
module.exports = ( options ) => {
  let contextLogger = {} 
  let config = {}

  // 继承自 baseInfo 默认参数
  const opts = Object.assign({}, baseInfo, options || {}) ;
  const {projectName,serverIp,appLogLevel,dir,env} = opts;
  
  const currentLevel = methods.findIndex(ele => ele === appLogLevel)
  const appenders = {}
  const commonInfo = { projectName, serverIp }

  appenders.tasks = {
    type: 'dateFile',
    filename: `${dir}/task`,
    pattern: '-yyyy-MM-dd.log',
    alwaysIncludePattern: true
  }
  if (env === "dev" || env === "local" || env === "development") {
    appenders.out = {
      type: "console"
    }
  }
  config = {
    appenders,
    categories: {
      default: {
        appenders: Object.keys(appenders),
        level: appLogLevel
      }
    }
  }

  const accessLogger = log4js.getLogger("access");
  
  const performanceLogger = log4js.getLogger("performance")

  return async (ctx, next) => {
    const start = Date.now()

    log4js.configure(config)
    methods.forEach((method, i) => {
      if (i >= currentLevel) {
        contextLogger[method] = (message) => {
          performanceLogger[method](access(ctx, message, commonInfo))
        }
      } else {
        contextLogger[method] = () => {}
      }
    })
    ctx.log = contextLogger;

    const logger = log4js.getLogger()
    await next()
    const delta = Date.now() - start;
    accessLogger.info(access(ctx, {
      responseTime: delta
    }, commonInfo))
  }
}