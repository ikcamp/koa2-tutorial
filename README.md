# log 日志中间件 
> 最困难的事情就是认识自己。

<br/> 

在一个真实的项目中，开发只是整个投入的一小部分，版本迭代和后期维护占了极其重要的部分。项目上线运转起来之后，我们如何知道项目运转的状态呢？如何发现线上存在的问题，如何及时进行补救呢？记录日志就是解决困扰的关键方案。正如我们每天写日记一样，不仅能够记录项目每天都做了什么，便于日后回顾，也可以将做错的事情记录下来，进行自我反省。完善的日志记录不仅能够还原问题场景，还有助于统计访问数据，分析用户行为。 

<br/> 

## 日志的作用 

* 显示程序运行状态
* 帮助开发者排除问题故障
* 结合专业的日志分析工具（如 ELK ）给出预警 

<br/> 

## 关于编写 log 中间件的预备知识 

<br/> 

### log4js 

本项目中的 `log` 中间件是基于 `log4js 2.x` 的封装，[Log4js](https://github.com/nomiddlename/log4js-node) 是 `Node.js` 中一个成熟的记录日志的第三方模块，下文也会根据中间件的使用介绍一些 `log4js` 的使用方法。 

<br/> 

### 日志分类 

日志可以大体上分为访问日志和应用日志。访问日志一般记录客户端对项目的访问，主要是 `http` 请求。这些数据属于运营数据，也可以反过来帮助改进和提升网站的性能和用户体验；应用日志是项目中需要特殊标记和记录的位置打印的日志，包括出现异常的情况，方便开发人员查询项目的运行状态和定位 `bug` 。应用日志包含了`debug`、`info`、`warn` 和 `error`等级别的日志。 

<br/>

### 日志等级

`log4js` 中的日志输出可分为如下7个等级：

![LOG_LEVEL.957353bf.png](http://upload-images.jianshu.io/upload_images/3860275-7e8db4f9d1aed430.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240) 

<br/>

在应用中按照级别记录了日志之后，可以按照指定级别输出高于指定级别的日志。 

<br/> 

### 日志切割 

当我们的项目在线上环境稳定运行后，访问量会越来越大，日志文件也会越来越大。日益增大的文件对查看和跟踪问题带来了诸多不便，同时增大了服务器的压力。虽然可以按照类型将日志分为两个文件，但并不会有太大的改善。所以我们按照**日期**将日志文件进行分割。比如：今天将日志输出到 `task-2017-10-16.log` 文件，明天会输出到 `task-2017-10-17.log` 文件。减小单个文件的大小不仅方便开发人员按照日期排查问题，还方便对日志文件进行迁移。

<br/> 

## 如何实现 

<br/> 

### 初始化日志 demo 

#### 1. 安装 `log4js` 模块 

```js
npm i log4js -S
``` 

<br/>

#### 2. `log4js` 官方示例

在 `middleware/` 目录下创建 `mi-log/demo.js`，并贴入官方示例代码： 

```js
const log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
});

const logger = log4js.getLogger('cheese');
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
``` 

<br/>

然后在 `/middleware/mi-log/` 目录下运行：

```js
cd ./middleware/mi-log/ && node demo.js
```

<br/> 

运行之后，在当前的目录下会产生一个日志文件 `cheese.log`，里面记录了 `error` 以上级别的信息，也就是如下内容： 

```txt
[2017-10-24 15:51:30.770] [ERROR] cheese - Cheese is too ripe!
[2017-10-24 15:51:30.774] [FATAL] cheese - Cheese was breeding ground for listeria.
```

**注意：** 日志文件产生的位置就是当前启动环境的位置。

<br/> 

分析以上代码就会发现，`configure` 函数配置了日志的基本信息 

```js
{
  /**
   * 指定要记录的日志叫作 cheese
   * 展示方式为文件类型 file
   * 展示的文件名 cheese.log
   */
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },

  /**
   * 指定日志的默认配置项
   * 如果 log4js.getLogger 中没有指定，默认为 cheese 日志的配置项
   * 指定 cheese 日志的记录内容为 error 及 error 以上级别的信息
   */
  categories: { default: { appenders: ['cheese'], level: 'error' } }
}
``` 

<br/> 

在上述代码的基础上，我们只需要提取出公用的配置项，并封装一些函数方法，比如在上下文中挂载 `log` 函数，基本上就能实现项目中的日志功能。 

<br/> 

### 日志中间件雏形 

#### 1. 提取部分变量 

创建 `/mi-log/logger.js` 文件，并增加如下代码： 

```js
const log4js = require('log4js');
const path = require("path");

module.exports = () => {
  let config = {}
  const appLogLevel = 'debug' // 指定记录的日志级别
  const dir = 'logs'  // 指定日志存放的目录名
  const env = 'dev'   // 指定当前环境，当为开发环境时，在控制台也输出，方便调试
  const projectName = 'koa2-tutorial' // 项目名，记录在日志中的项目信息
  const serverIp = '0.0.0.0' // 默认情况下服务器 ip 地址
  
  const appenders = {}

  appenders.tasks = { // 指定输出的日志文件名字为 task 
    type: 'dateFile', // 日志类型 
    filename: `${dir}/task`, // 输出的文件名
    pattern: '-yyyy-MM-dd.log', // 文件名增加后缀
    alwaysIncludePattern: true  // 是否总是有后缀名
  }

  // 开发环境添加终端打印日志
  if (env === "dev" || env === "local" || env === "development") {
    appenders.out = {
      type: "console"
    }
  }

  config = {
    appenders,
    categories: {
      default: {
        appenders: Object.keys(appenders), // 默认为 tasks
        level: appLogLevel // 指定记录的日志级别，当前为 'debug' 及以上
      }
    }
  }

  return async (ctx, next) => {
    log4js.configure(config)
    const logger = log4js.getLogger()
    await next()
    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');
  }
}
``` 

代码中，我们指定了几个常量以方便后面提取，比如 `appLogLevel`、`dir`、`env` 等。 

<br/> 

#### 2. 引用中间件 

修改 `middleware/index.js`，在代码中引入中间件： 

```js
const path = require('path')
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')

const miSend = require('./mi-send')
// 引入日志中间件
const miLog = require('./mi-log/logger')
module.exports = (app) => {
  // 调用中间件
  app.use(miLog())

  app.use(staticFiles(path.resolve(__dirname, "../public")))
  app.use(nunjucks({
    ext: 'html',
    path: path.join(__dirname, '../views'),
    nunjucksConfig: {
      trimBlocks: true
    }
  }));
  app.use(bodyParser())
  app.use(miSend())
}
``` 

<br/>

这时候打开浏览器并访问 `http://localhost:3000`，中间件执行便会在相对应的日期文件中记录下访问日志。

```txt
├── node_modules/
├── logs/ 
│     ├── task-2017-10-24.log 
├── ……
├── app.js
```

<br/> 

此时的访问日志都是简单的固定字符串，尚达不到我们的目标。我们需要增加一些细节上的东西，比如：『请求方式』、『客户端信息』和『请求源』等来丰富我们的日志。

<br/> 

### 丰富日志信息 

从代码上不难看出，我们想要丰富的信息，都是在日志不同级别的调用上写入文件的。所以我们需要对这几个级别的方法进行封装处理。 

```js
logger.trace('trace');
logger.debug('debug');
logger.info('info');
logger.warn('warn');
logger.error('error');
logger.fatal('fatal');
```

<br/> 

#### 1. 对不同级别的日志输出函数进行封装 

修改 `mi-log/logger.js` 文件，代码如下所示： 

```js
const log4js = require('log4js');
const path = require("path");

// 将日志的不同级别提取为数组，方便后面做处理
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

module.exports = () => {
  // 增加 contextLogger 对象，用来临时存储不同级别的日志输出函数
  let contextLogger = {} 

  let config = {}
  const appLogLevel = 'debug'
  const dir = 'logs'
  const env = 'dev'
  const projectName = 'koa2-tutorial'
  const serverIp = '0.0.0.0'
  
  // 创建常量 用来存储需要记录的日志级别在数组 methods 中的下标
  const currentLevel = methods.findIndex(ele => ele === appLogLevel)

  const appenders = {}
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

  // 创建一个名为 performance 的日志专门用于记录『应用异常』 
  const performanceLogger = log4js.getLogger("performance")

  return async (ctx, next) => {
    log4js.configure(config)
   
    // 指定需要记录的级别日志，进行二次封装，如果不需要记录级别，直接为空函数   
    methods.forEach((method, i) => {
      if (i >= currentLevel) {
        contextLogger[method] = (message) => {
          performanceLogger[method]( message )
        }
      } else {
        contextLogger[method] = () => {}
      }
    })
    // 将各日志输出函数以对象的形式挂载到 ctx.log 上
    ctx.log = contextLogger;

    const logger = log4js.getLogger()
    await next()
    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');
  }
}
```

<br/> 

封装之后，我们修改 `middleware/index.js`，在文件的尾部增加中间件，来测试下：

```js
module.exports = (app) => {
  // 以上内容已省略

  // 增加的『测试代码』如下
  app.use(async (ctx, next)=>{
    await next()
    ctx.log.error('500 error Test')
  })
}
``` 

<br/> 

重启服务器后，再次访问 `http://localhost:3000`，就会发现 `logs/task-2017-10-24.log` 文件里面已经存在了我们想要的信息。

<br/> 

#### 2. 封装写入的日志信息内容 

在上下文 `ctx` 对象中，有我们想要的很多信息，所以完全可以通过它来丰富日志内容。在这里，我们只需要修改传入的参数： 

```js
performanceLogger[method](message)
``` 

可以看到参数 `message` 是一个字符串，所以我们封装一个函数，用来把信息与上下文 `ctx` 相结合，并返回字符串。 

<br/> 

增加日志信息的封装文件 `mi-log/access.js`： 

```js
module.exports = (ctx, message, commonInfo) => {
  const {
    method,
    url,
    host,
    headers
  } = ctx.request;
  const client = {
    method,
    url,
    host,
    message,
    referer: headers['referer'],
    userAgent: headers['user-agent']
  }
  return JSON.stringify(Object.assign(commonInfo, client));
}
``` 

**注意：** 最终返回的是字符串。 

<br/> 

在 `mi-log/logger.js` 文件中调用： 

```js
const log4js = require('log4js');
const path = require("path");

// 引入日志输出信息的封装文件
const access = require("./access.js");

const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"];
module.exports = () => {
  let contextLogger = {} 
  let config = {}
  const appLogLevel = 'debug'
  const dir = 'logs'
  const env = 'dev'
  const projectName = 'koa2-tutorial'
  const serverIp = '0.0.0.0'
  
  const currentLevel = methods.findIndex(ele => ele === appLogLevel)
  const appenders = {}

  // 增加常量，用来存储公用的日志信息
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
  const performanceLogger = log4js.getLogger("performance")
  return async (ctx, next) => {
    log4js.configure(config)
    methods.forEach((method, i) => {
      if (i >= currentLevel) {
        contextLogger[method] = (message) => {
          // 将入参换为函数返回的字符串
          performanceLogger[method](access(ctx, message, commonInfo))
        }
      } else {
        contextLogger[method] = () => {}
      }
    })
    ctx.log = contextLogger;

    const logger = log4js.getLogger()
    await next()
    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');
  }
}
```

<br/> 

重启服务器并访问 `http://localhost:3000` 就会发现，日志文件的记录内容已经变化。 

<br/> 

#### 3. 增加访问日志记录 

之前的代码中，我们已经扩展了『应用日志』，这里我们再扩展下『访问日志』，用于对访客信息及服务器响应时间进行记录。代码很简单： 

```js
const log4js = require('log4js');
const path = require("path");
const access = require("./access.js");

const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]
module.exports = () => {
  let contextLogger = {} 
  let config = {}
  const appLogLevel = 'debug'
  const dir = 'logs'
  const env = 'dev'
  const projectName = 'koa2-tutorial'
  const serverIp = '0.0.0.0'
  
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

  // 增加访问日志
  const accessLogger = log4js.getLogger("access");
  
  const performanceLogger = log4js.getLogger("performance")

  return async (ctx, next) => {
    // 记录开始时间
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

    // 记录响应时间，并输出到日志文件中
    const delta = Date.now() - start;
    accessLogger.info(client(ctx, {
      responseTime: delta
    }, commonInfo))
  }
}
``` 

<br/> 

代码到这里，已经完成了大部分的日志功能。下面我们完善下其他功能：提取公用参数和捕捉错误。 

<br/> 

### 提取公用参数 

#### 1. 修改 `mi-log/logger.js` 文件，提取参数变量

```js
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
module.exports = (options) => {
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
``` 

<br/> 

#### 2. 修改中间件的调用 

安装依赖文件 `ip`: 

```js
npm i ip -S
```

<br/> 

修改 `middleware/index.js` 中的调用方法 

```js
const path = require('path')
const ip = require('ip')
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')

const miSend = require('./mi-send')
const miLog = require('./mi-log/logger')
module.exports = (app) => {

  app.use(miLog({
    env: app.env, // koa 提供的环境变量
    projectName: 'koa2-tutorial',
    appLogLevel: 'debug',
    dir: 'logs',
    serverIp: ip.address()
  }))

  app.use(staticFiles(path.resolve(__dirname, "../public")))

  app.use(nunjucks({
    ext: 'html',
    path: path.join(__dirname, '../views'),
    nunjucksConfig: {
      trimBlocks: true
    }
  }));

  app.use(bodyParser())
  app.use(miSend())
}
``` 

<br/> 

### 捕捉错误信息 

对于日志中间件里面的错误，我们也需要捕获并处理。在这里，我们提取一层进行封装。

#### 1. 新建 `mi-log/index.js` 文件，代码如下： 

```js
const logger = require("./logger")
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
    })
  }
}
``` 

<br/> 

如果中间件里面有抛出错误，这里将会捕捉到并处理，然后记录到日志中，最后再次抛出给其他中间件处理。 

<br/> 

#### 2. 修改 `middleware/index.js` 的调用方法 

```js
// const miLog = require('./mi-log/logger')
// 修改为 index.js 文件
const miLog = require('./mi-log')
```

<br/> 

到这里我们的日志中间件已经制作完成。当然，还有很多的情况我们需要根据项目情况来继续扩展，比如结合『监控系统』、『日志分析预警』和『自动排查跟踪机制』等。可以参考一下[官方文档](http://logging.apache.org/log4j/2.x/)。

<br/> 

下一节中，我们将学习下如何处理请求错误。




















