const log4js = require('log4js');
const access = require("./access.js");
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

const baseInfo = {
  appLogLevel: 'debug',
  dir: 'logs',
  env: 'dev',
  projectName: 'koa2-tutorial',
  serverIp: '0.0.0.0'
}

module.exports = (options) => {
  const contextLogger = {}
  const appenders = {}
  
  const opts = Object.assign({}, baseInfo, options || {})
  const { env, appLogLevel, dir, serverIp, projectName } = opts
  const commonInfo = { projectName, serverIp }
	
  appenders.cheese = {
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
  let config = {
    appenders,
    categories: {
      default: {
        appenders: Object.keys(appenders),
        level: appLogLevel
      }
    }
  }

  const logger = log4js.getLogger('cheese');

  return async (ctx, next) => {
    const start = Date.now()

    log4js.configure(config)
    methods.forEach((method, i) => {
      contextLogger[method] = (message) => {
        logger[method](access(ctx, message, commonInfo))
      }
    })
    ctx.log = contextLogger;

    await next()
    const responseTime = Date.now() - start;
    logger.info(access(ctx, {
      responseTime: `响应时间为${responseTime/1000}s`
    }, commonInfo))
  }
}
