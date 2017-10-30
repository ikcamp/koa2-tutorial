# 处理错误请求 
> 爱能遮掩一切过错。 

<br/> 

当我们在访问一个站点的时候，如果访问的地址不存在(404)，或服务器内部发生了错误(500)，站点会展示出某个特定的页面，比如： 

<div align="center"><img src="./images/mi-error-1.jpg" /></div> 

<br/> 

那么如何在 `Koa` 中实现这种功能呢？其实，一个简单的中间件即可实现，我们把它称为 `http-error`。实现过程并不复杂，拆分为三步来看： 

 - 第一步：确认需求
 - 第二步：整理思路
 - 第三步：代码实现

<br/>

## 确认需求 
> 打造一个事物前，需要先确认它具有什么特性，这就是需求。 

<br/>

在这里，稍微整理下即可得到几个基本需求：

- 在页面请求出现 `400` 、 `500` 类错误码的时候，引导用户至错误页面；
- 提供默认错误页面；
- 允许使用者自定义错误页面。

<br/>

## 整理思路 

现在，从一个请求进入 `Koa` 开始说起：

1. 一个请求访问 `Koa`，出现了错误；
2. 该错误会被 `http-error` 中间件捕捉到；
3. 错误会被中间件的错误处理逻辑捕捉到，并进行处理；
4. 错误处理逻辑根据错误码状态，调用渲染页面逻辑；
5. 渲染页面逻辑渲染出对应的错误页面。

可以看到，关键点就是捕捉错误，以及实现错误处理逻辑和渲染页面逻辑。

<br/>

## 代码实现

### 建立文件

基于教程目录结构，我们创建 `middleware/mi-http-error/index.js` 文件，存放中间件的逻辑代码。初始目录结构如下:

```
middleware/
├─ mi-http-error/
│  └── index.js
└─ index.js
```

**注意：** 目录结构不存在，需要自己创建。

<br/>

### 捕捉错误 

该中间件第一项需要实现的功能是捕捉到所有的 `http` 错误。根据中间件的洋葱模型，需要做几件事：

#### 1. 引入中间件 

修改 `middleware/index.js`，引入 `mi-http-error` 中间件，并将它放到洋葱模型的最外层 

```js
const path = require('path')
const ip = require("ip")
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')
const miSend = require('./mi-send')
const miLog = require('./mi-log')

// 引入请求错误中间件
const miHttpError = require('./mi-http-error')
module.exports = (app) => {
  // 应用请求错误中间件
  app.use(miHttpError())
  app.use(miLog(app.env, {
    env: app.env,
    projectName: 'koa2-tutorial',
    appLogLevel: 'debug',
    dir: 'logs',
    serverIp: ip.address()
  }));
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

#### 2. 捕获中间件异常情况 

修改 `mi-http-error/index.js`，在中间件内部对内层的其它中间件进行错误监听，并对捕获 `catch` 到的错误进行处理

```js
module.exports = () => {
  return async (ctx, next) => {
    try {
       await next();
       /**
        * 如果没有更改过 response 的 status，则 koa 默认的 status 是 404 
        */
       if (ctx.response.status === 404 && !ctx.response.body) ctx.throw(404);
    } catch (e) {
      /*此处进行错误处理，下面会讲解具体实现*/
    }
  }
}
```

<br/>

上面的准备工作做完，下面实现两个关键逻辑。

<br/>

### 错误处理逻辑

错误处理逻辑其实很简单，就是对错误码进行判断，并指定要渲染的文件名。这段代码运行在错误 `catch` 中。 

修改 `mi-http-error/index.js`：

```js
module.exports = () => {
  let fileName = 'other'
  return async (ctx, next) => {
    try {
       await next();
       /**
        * 如果没有更改过 response 的 status，则 koa 默认的 status 是 404 
        */
       if (ctx.response.status === 404 && !ctx.response.body) ctx.throw(404);
    } catch (e) {
      let status = parseInt(e.status)
      // 默认错误信息为 error 对象上携带的 message
      const message = e.message

      // 对 status 进行处理，指定错误页面文件名 
      if(status >= 400){
        switch(status){
          case 400:
          case 404:
          case 500:
            fileName = status;
            break;
          // 其它错误 指定渲染 other 文件
          default:
            fileName = 'other'
        }
      }
    }
  }
}
``` 

也就是说，对于不同的情况，会展示不同的错误页面：

```txt
├─ 400.html
├─ 404.html
├─ 500.html
├─ other.html
```

这几个页面文件我们会在后面创建，接下来我们开始讲述下页面渲染的问题。 

<br/>

### 渲染页面逻辑

首先我们创建默认的错误页面模板文件 `mi-http-error/error.html`，这里采用 `nunjucks` 语法。

```html
<!DOCTYPE html>
<html>
<head>
  <title>Error - {{ status }}</title>
</head>
<body>
  <div id="error">
    <h1>Error - {{ status }}</h1>
    <p>Looks like something broke!</p>
    {% if (env === 'development') %}
    <h2>Message:</h2>
    <pre>
      <code>
        {{ error }}
      </code>
    </pre>
    <h2>Stack:</h2>
    <pre>
      <code>
        {{ stack }}
      </code>
    </pre> 
    {% endif %}
  </div>
</body>
</html>
```

<br/> 

因为牵涉到文件路径的解析，我们需要引入 `path` 模块。另外，还需要引入 `nunjucks` 工具来解析模板。`path` 是 `node` 模块，我们只需从 `npm` 上安装`nunjucks` 即可。 

<br/>

安装 `nunjucks` 模块来解析模板文件： 

```js
npm i nunjucks -S
```

<br/> 

修改 `mi-http-error/index.js`，引入 `path` 和 `nunjucks` 模块： 

```js
// 引入 path nunjucks 模块 
const Path = require('path') 
const nunjucks = require('nunjucks')

module.exports = () => {
  // 此处代码省略，与之前一样
}
``` 

<br/> 

为了支持自定义错误文件目录，原来调用中间件的代码需要修改一下。我们给中间件传入一个配置对象，该对象中有一个字段 `errorPageFolder`，表示自定义错误文件目录。 

修改 `middleware/index.js`： 

```js
// app.use(miHttpError())
app.use(miHttpError({
  errorPageFolder: path.resolve(__dirname, '../errorPage')
}))
``` 

**注意：** 代码中，我们指定了 `/errorPage` 为默认的模板文件目录。 

<br/> 

修改 `mi-http-error/index.js`，处理接收到的参数： 

```js
const Path = require('path') 
const nunjucks = require('nunjucks')

module.exports = (opts = {}) => {
  // 400.html 404.html other.html 的存放位置
  const folder = opts.errorPageFolder
  // 指定默认模板文件
  const templatePath = Path.resolve(__dirname, './error.html') 

  let fileName = 'other'
  return async (ctx, next) => {
    try {
       await next()
       if (ctx.response.status === 404 && !ctx.response.body) ctx.throw(404);
    } catch (e) {
      let status = parseInt(e.status)
      const message = e.message
      if(status >= 400){
        switch(status){
          case 400:
          case 404:
          case 500:
            fileName = status;
            break;
          default:
            fileName = 'other'
        }
      }else{// 其它情况，统一返回为 500
        status = 500
        fileName = status
      }
      // 确定最终的 filePath 路径
      const filePath = folder ? Path.join(folder, `${fileName}.html`) : templatePath
    }
  }
}
``` 

<br/> 

路径和参数准备好之后，我们需要做的事情就剩返回渲染的页面了。

<br/> 

修改 `mi-http-error/index.js`，对捕捉到的不同错误返回相应的视图页面： 

```js
const Path = require('path') 
const nunjucks = require('nunjucks')
module.exports = (opts = {}) => {
  // 增加环境变量，用来传入到视图中，方便调试
  const env = opts.env || process.env.NODE_ENV || 'development'  

  const folder = opts.errorPageFolder
  const templatePath = Path.resolve(__dirname, './error.html')
  let fileName = 'other'
  return async (ctx, next) => {
    try {
       await next()
       if (ctx.response.status === 404 && !ctx.response.body) ctx.throw(404);
    } catch (e) {
      let status = parseInt(e.status)
      const message = e.message
      if(status >= 400){
        switch(status){
          case 400:
          case 404:
          case 500:
            fileName = status;
            break;
          default:
            fileName = 'other'
        }
      }else{
        status = 500
        fileName = status
      }
      const filePath = folder ? Path.join(folder, `${fileName}.html`) : templatePath
      
      // 渲染对应错误类型的视图，并传入参数对象
      try{
        // 指定视图目录
        nunjucks.configure( folder ? folder : __dirname )
        const data = await nunjucks.render(filePath, {
          env: env, // 指定当前环境参数
          status: e.status || e.message, // 如果错误信息中没有 status，就显示为 message
          error: e.message, // 错误信息
          stack: e.stack // 错误的堆栈信息
        })
        // 赋值给响应体
        ctx.status = status
        ctx.body = data
      }catch(e){
        // 如果中间件存在错误异常，直接抛出信息，由其他中间件处理
        ctx.throw(500, `错误页渲染失败:${e.message}`)
      }
    }
  }
}
``` 

上面所做的是使用渲染引擎对模板文件进行渲染，并将生成的内容放到 `Http` 的 `Response` 中，展示在用户面前。感兴趣的同学可以去中间件源码中查看 `error.html` 查看模板内容（其实是从 `koa-error` 那里拿来稍作修改的）。 

<br/> 

在代码的最后，我们还有一个异常的抛出 `ctx.throw()`，也就是说，中间件处理时候也会存在异常，所以我们需要在最外层做一个错误监听处理。 

修改 `middleware/index.js`： 

```js
const path = require('path')
const ip = require("ip")
const bodyParser = require('koa-bodyparser')
const nunjucks = require('koa-nunjucks-2')
const staticFiles = require('koa-static')

const miSend = require('./mi-send')
const miLog = require('./mi-log')
const miHttpError = require('./mi-http-error')
module.exports = (app) => {
  app.use(miHttpError({
    errorPageFolder: path.resolve(__dirname, '../errorPage')
  }))

  app.use(miLog(app.env, {
    env: app.env,
    projectName: 'koa2-tutorial',
    appLogLevel: 'debug',
    dir: 'logs',
    serverIp: ip.address()
  }));

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

  // 增加错误的监听处理
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
```

<br/> 

下面，我们增加对应的错误渲染页面： 

创建 `errorPage/400.html`： 

```html
<!DOCTYPE html>
<html>
<head>
  <title>400</title>
</head>
<body>
  <div id="error">
    <h1>Error - {{ status }}</h1>
    <p>错误码 400 的描述信息</p>
    {% if (env === 'development') %}
    <h2>Message:</h2>
    <pre>
      <code>
        {{ error }}
      </code>
    </pre>
    <h2>Stack:</h2>
    <pre>
      <code>
        {{ stack }}
      </code>
    </pre> 
    {% endif %}
  </div>
</body>
</html>
``` 

<br/> 

创建 `errorPage/404.html`： 

```html
<!DOCTYPE html>
<html>
<head>
  <title>404</title>
</head>
<body>
  <div id="error">
    <h1>Error - {{ status }}</h1>
    <p>错误码 404 的描述信息</p>
    {% if (env === 'development') %}
    <h2>Message:</h2>
    <pre>
      <code>
        {{ error }}
      </code>
    </pre>
    <h2>Stack:</h2>
    <pre>
      <code>
        {{ stack }}
      </code>
    </pre> 
    {% endif %}
  </div>
</body>
</html>
```

<br/> 

创建 `errorPage/500.html`： 

```html
<!DOCTYPE html>
<html>
<head>
  <title>500</title>
</head>
<body>
  <div id="error">
    <h1>Error - {{ status }}</h1>
    <p>错误码 500 的描述信息</p>
    {% if (env === 'development') %}
    <h2>Message:</h2>
    <pre>
      <code>
        {{ error }}
      </code>
    </pre>
    <h2>Stack:</h2>
    <pre>
      <code>
        {{ stack }}
      </code>
    </pre> 
    {% endif %}
  </div>
</body>
</html>
``` 

<br/> 

创建 `errorPage/other.html`： 

```html
<!DOCTYPE html>
<html>
<head>
  <title>未知异常</title>
</head>
<body>
  <div id="error">
    <h1>Error - {{ status }}</h1>
    <p>未知异常</p>
    {% if (env === 'development') %}
    <h2>Message:</h2>
    <pre>
      <code>
        {{ error }}
      </code>
    </pre>
    <h2>Stack:</h2>
    <pre>
      <code>
        {{ stack }}
      </code>
    </pre> 
    {% endif %}
  </div>
</body>
</html>
``` 

<br/> 

`errorPage` 中的页面展示内容，可以根据自己的项目信息修改，以上仅供参考。 

<br/> 

至此，我们基本完成了用来处理『请求错误』的中间件。而这个中间件并不是固定的形态，大家在真实项目中，还需要多考虑自己的业务场景和需求，打造出适合自己项目的中间件。
