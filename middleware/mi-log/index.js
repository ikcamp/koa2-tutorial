const logger = require("./logger");

/**
 * 中间件错误处理
 * 
 * @param {any} options 
 * @returns 
 */
module.exports = (options) => {

  const loggerMiddleware = logger(options)

  return (ctx, next) => {
    return loggerMiddleware(ctx, next)
    .catch((e) => {
        if (ctx.status < 500) {
            ctx.status = 500;
        }
        ctx.log.error(e.stack);
        ctx.state.logged = true;
        ctx.throw(e);
    });
  };
}