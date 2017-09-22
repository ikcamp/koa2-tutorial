const Koa = require('koa')
const middleware = require('./middleware')
const config = require('./config')
const isProd = process.env.NODE_ENV === 'production'
const port = isProd?config.prod.port:config.dev.port
const app = new Koa()

middleware(app)
app.listen(port)
console.log(`app started at port ${port}...`);