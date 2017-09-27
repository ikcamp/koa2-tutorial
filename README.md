## Koa 起手 

<br> 

### <a>&sect; 准备工作</a>
> 身为程序员，第一招必是『Hello World』。 

<br> 

首先，创建一个目录 `koa2-tutorial/` 用来存放我们的代码，然后进入到你创建的目录里面，新建文件 `app.js` 并在里面写下： 

```js
console.log('Hello World')
``` 

<br>

然后在 `koa2-tutorial/` 目录下运行 `app.js`：

```js
node app.js
```

成功看到输出 `Hello World`，说明环境很安全。 

**注意：** 请保证 `node` 环境在 `7.6` 版本以上(`Koa2` 需要应用 `async/await` 等新语法)。 

<br> 

然后，新建 `package.json` 文件来管理项目中用到一些安装包。在当前目录下运行： 

```js
npm init
``` 

一路默认后，项目结构应该如下： 

```txt
├── app.js
├── package.json
``` 

<br>

下面我们会基于 `Koa2` 启动服务器。

<br>

### <a>&sect; 启动服务器</a> 

运行如下命令，安装 `Koa`(版本信息会自动保存在 `package.json` 中) 

```js
npm install koa
```

<br>  

重写 `app.js`，增加如下代码： 

```js
const Koa = require('koa')
const app = new Koa()

app.listen(3000)
console.log(`app started at port 3000...`);
``` 

运行 `node app.js` 并打开浏览器访问 `localhost:3000`，页面显示 `Not Found`。 

因为在启动服务器后，代码并没有做其他的事情，也就没有了交互。

我们继续修改 `app.js` 文件： 

```js
const Koa = require('koa')
const app = new Koa()

// 增加代码
app.use(async (ctx, next) => {
  await next()
  ctx.response.type = 'text/html'
  ctx.response.body = '<h1>Hello World</h1>'
})

app.listen(3000, () => {
  console.log('server is running at http://0.0.0.0:3000')
})
``` 

重启服务器并再次访问，页面将正常显示 `Hello World`。 

<br>  

我们增加的代码里面，用到了 `Koa` 的中间件，下一节我们讲述下中间件的用法。

<br>
