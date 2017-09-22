let uuid = require("node-uuid")
const isProduction = process.env.NODE_ENV === 'production'
module.exports = () => {
  return function (context, next) {
    var id = uuid.v4().replace(/-/g, "")
    context.state.scope = {
      __requestId: id,
      __sourceMap(path){
        return path
      }
    }
    context.state.requestId = id
    return next()
  }
}