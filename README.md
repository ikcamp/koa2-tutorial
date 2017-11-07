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

## 代码实现 


#### 安装 `log4js` 模块 

```js
npm i log4js -S
``` 

<br/>

#### `log4js` 官方简单示例


在 `middleware/` 目录下创建 `mi-log/demo.js`，并贴入官方示例代码： 

```js
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
logger.debug("Some debug messages");

```

<br/>

然后在 `/middleware/mi-log/` 目录下运行：

```js
cd ./middleware/mi-log/ && node demo.js
```

<br/>

可以在终端看到如下输出：

```txt
[2017-10-24 15:45:30.770] [DEBUG] default - Some debug messages
```

一段带有日期、时间、日志级别和调用 `debug` 方法时传入的字符串的文本日志。实现了简单的终端日志输出。

<br/>

#### `log4js` 官方复杂示例


替换 `mi-log/demo.js` 中的代码为如下：

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

再次在 `/middleware/mi-log/` 目录下运行：

```js
node demo.js
```

<br/> 

运行之后，在当前的目录下会生成一个日志文件 `cheese.log`文件，文件中有两条日志并记录了 `error` 及以上级别的信息，也就是如下内容： 

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
   * 指定要记录的日志分类 cheese
   * 展示方式为文件类型 file
   * 日志输出的文件名 cheese.log
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


#### 改写为log中间件

创建 `/mi-log/logger.js` 文件，并增加如下代码：

```js
const log4js = require('log4js');
module.exports = ( options ) => {
  return async (ctx, next) => {
    const start = Date.now()
    log4js.configure({
      appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
      categories: { default: { appenders: ['cheese'], level: 'info' } }
    }); 
    const logger = log4js.getLogger('cheese');
    await next()
    const end = Date.now()
    const responseTime = end - start;
    logger.info(`响应时间为${responseTime/1000}s`);
  }
}
``` 

<br/> 

创建 `/mi-log/index.js` 文件，并增加如下代码： 

```js
const logger = require("./logger")
module.exports = () => {
   return logger()
}
```

<br/> 

修改  `middleware/index.js` 文件，并增加对 `log` 中间件的注册， 如下代码： 

```js
const path = require('path')
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')

const miSend = require('./mi-send')
// 引入日志中间件
const miLog = require('./mi-log')
module.exports = (app) => {
  // 注册中间件
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

打开浏览器并访问 `http://localhost:3000`， 来发送一个`http` 请求。

如上，按照前几节课程中讲解的中间件的写法，将以上代码改写为中间件。 基于 `koa` 的洋葱模型，当 `http` 请求经过此中间件时便会在 `cheese.log` 文件中打印一条日志级别为 `info` 的日志并记录了请求的响应时间。如此，便实现了访问日志的记录。

<br/> 

#### 实现应用日志，将其挂载到 `ctx` 上


若要在其他中间件或代码中通过 `ctx` 上的方法打印日志，首先需要在上下文中挂载 `log` 函数。打开 `/mi-log/logger.js` 文件：

```js
const log4js = require('log4js');
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

module.exports = () => {
  const contextLogger = {}
  log4js.configure({
    appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
    categories: { default: { appenders: ['cheese'], level: 'info' } }
  }); 
 
  const logger = log4js.getLogger('cheese');
  
  return async (ctx, next) => {
  	 // 记录请求开始的时间
    const start = Date.now()
	 // 循环methods将所有方法挂载到ctx 上
    methods.forEach((method, i) => {
	   contextLogger[method] = (message) => {
	     logger[method](message)
	   }
    })
    ctx.log = contextLogger;

    await next()
    // 记录完成的时间 作差 计算响应时间
    const responseTime = Date.now() - start;
    logger.info(`响应时间为${responseTime/1000}s`);
  }
}

```
创建 `contextLogger` 对象，将所有的日志级别方法赋给对应的 `contextLogger` 对象方法。在将循环后的包含所有方法的 `contextLogger` 对象赋给 `ctx` 上的 `log` 方法。

<br/> 

打开 `/mi-send/index.js` 文件， 并调用 `ctx` 上的 `log` 方法：

```js
module.exports = () => {
  function render(json) {
      this.set("Content-Type", "application/json")
      this.body = JSON.stringify(json)
  }
  return async (ctx, next) => {
      ctx.send = render.bind(ctx)
      // 调用ctx上的log方法下的error方法打印日志
      ctx.log.error('ikcamp');
      await next()
  }
}
```

在其他中间件中通过调用 `ctx` 上的 `log` 方法，从而实现打印应用日志。

<br/>

```js
const log4js = require('log4js');
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

module.exports = () => {
  const contextLogger = {}
  const config = {
    appenders: {
    	cheese: {
	     type: 'dateFile', // 日志类型 
	     filename: `logs/task`,  // 输出的文件名
	     pattern: '-yyyy-MM-dd.log',  // 文件名增加后缀
	     alwaysIncludePattern: true   // 是否总是有后缀名
	   }
    },
    categories: {
      default: {
        appenders: ['cheese'],
        level:'info'
      }
    }
  }

  const logger = log4js.getLogger('cheese');

  return async (ctx, next) => {
    const start = Date.now()

    log4js.configure(config)
    methods.forEach((method, i) => {
      contextLogger[method] = (message) => {
        logger[method](message)
      }
    })
    ctx.log = contextLogger;

    await next()
    const responseTime = Date.now() - start;
    logger.info(`响应时间为${responseTime/1000}s`);
  }
}

```

<br/>

修改日志类型为日期文件，按照日期切割日志输出，以减小单个日志文件的大小。这时候打开浏览器并访问 `http://localhost:3000`，这时会自动生成一个 `logs` 目录，并生成一个 `cheese-2017-10-24.log` 文件， 中间件执行便会在其中中记录下访问日志。

```txt
├── node_modules/
├── logs/ 
│     ├── cheese-2017-10-24.log 
├── ……
├── app.js
```

<br/>

#### 抽出可配置量

```js
const log4js = require('log4js');
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

// 提取默认公用参数对象
const baseInfo = {
  appLogLevel: 'debug',  // 指定记录的日志级别
  dir: 'logs',		// 指定日志存放的目录名
  env: 'dev',   // 指定当前环境，当为开发环境时，在控制台也输出，方便调试
  projectName: 'koa2-tutorial',  // 项目名，记录在日志中的项目信息
  serverIp: '0.0.0.0'		// 默认情况下服务器 ip 地址
}

const { env, appLogLevel, dir } = baseInfo
module.exports = () => {
  const contextLogger = {}
  const appenders = {}
  let config = {}
  
  appenders.cheese = {
    type: 'dateFile',
    filename: `${dir}/task`,
    pattern: '-yyyy-MM-dd.log',
    alwaysIncludePattern: true
  }
  // 环境变量为dev local development 认为是开发环境
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

  const logger = log4js.getLogger('cheese');

  return async (ctx, next) => {
    const start = Date.now()

    log4js.configure(config)
    methods.forEach((method, i) => {
      contextLogger[method] = (message) => {
        logger[method](message)
      }
    })
    ctx.log = contextLogger;

    await next()
    const responseTime = Date.now() - start;
    logger.info(`响应时间为${responseTime/1000}s`);
  }
}

```

代码中，我们指定了几个常量以方便后面提取，比如 `appLogLevel`、`dir`、`env` 等。 。并判断当前环境为开发环境则将日志同时输出到终端， 以便开发人员在开发是查看运行状态和查询异常。

<br/>


#### 丰富日志信息 


在 `ctx` 对象中，有一些客户端信息是我们数据统计及排查问题所需要的，所以完全可以利用这些信息来丰富日志内容。在这里，我们只需要修改挂载 `ctx` 对象的 `log` 函数的传入参数： 

```js
logger[method](message)
``` 

参数 `message` 是一个字符串，所以我们封装一个函数，用来把信息与上下文 `ctx` 中的客户端信息相结合，并返回字符串。 

<br/> 

增加日志信息的封装文件 `mi-log/access.js`： 

```js
module.exports = (ctx, message, commonInfo) => {
  const {
    method,  // 请求方法 get post或其他
    url,		  // 请求链接
    host,	  // 发送请求的客户端的host
    headers	  // 请求中的headers
  } = ctx.request;
  const client = {
    method,
    url,
    host,
    message,
    referer: headers['referer'],  // 请求的源地址
    userAgent: headers['user-agent']  // 客户端信息 设备及浏览器信息
  }
  return JSON.stringify(Object.assign(commonInfo, client));
}
``` 

**注意：** 最终返回的是字符串。 

取出 `ctx` 对象中请求相关信息及客户端 `userAgent` 等信息并转为字符串。

<br/> 

在 `mi-log/logger.js` 文件中调用： 

```js
const log4js = require('log4js');
// 引入日志输出信息的封装文件
const access = require("./access.js");
const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"]

const baseInfo = {
  appLogLevel: 'debug',
  dir: 'logs',
  env: 'dev',
  projectName: 'koa2-tutorial',
  serverIp: '0.0.0.0'
}
const { env, appLogLevel, dir, serverIp, projectName } = baseInfo
// 增加常量，用来存储公用的日志信息
const commonInfo = { projectName, serverIp }
module.exports = () => {
  const contextLogger = {}
  const appenders = {}

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
  config = {
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
       // 将入参换为函数返回的字符串
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
```

<br/> 

重启服务器并访问 `http://localhost:3000` 就会发现，日志文件的记录内容已经变化。代码到这里，已经完成了大部分的日志功能。下面我们完善下其他功能：自定义配置参数和捕捉错误。

<br/> 

#### 项目自定义内容

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
  // 将配置中间件的参数在注册中间件时作为参数传入
  app.use(miLog({
    env: app.env,  // koa 提供的环境变量
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

再次修改 `mi-log/logger.js` 文件：

```js
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
  
  // 继承自 baseInfo 默认参数
  const opts = Object.assign({}, baseInfo, options || {})
  // 需要的变量解构 方便使用
  const { env, appLogLevel, dir, serverIp, projectName } = opts;

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
  config = {
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
```

将项目中自定义的量覆盖默认值，解构使用。以达到项目自定义的目的。

<br/> 

#### 对日志中间件进行错误处理

对于日志中间件里面的错误，我们也需要捕获并处理。在这里，我们提取一层进行封装。

打开 `mi-log/index.js` 文件，修改代码如下： 

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

如果中间件里面有抛出错误，这里将通过 `catch` 函数捕捉到并处理，将状态码小于 `500` 的错误统一按照 `500` 错误码处理，以方便后面的 `http-error` 中间件显示错误页面。 调用 `log` 中间件打印堆栈信息并将错误抛出到最外层的全局错误监听进行处理。 

<br/> 


到这里我们的日志中间件已经制作完成。当然，还有很多的情况我们需要根据项目情况来继续扩展，比如结合『监控系统』、『日志分析预警』和『自动排查跟踪机制』等。可以参考一下[官方文档](http://logging.apache.org/log4j/2.x/)。

<br/> 

下一节中，我们将学习下如何处理请求错误。
