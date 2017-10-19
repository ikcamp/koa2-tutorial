# Koa 起手 

<br>

## 环境准备
由于 `koa2` 已经开始使用 `async/await` 等新语法，所以请保证 `node` 环境在 `7.6` 版本以上。

<br>

### 安装node.js

<br>

  - 直接安装 node.js ：node.js官网地址 [https://nodejs.org](https://nodejs.org)
  - nvm管理多版本 node.js ：可以用nvm 进行node版本进行管理
      - Mac 系统安装 nvm [https://github.com/creationix/nvm#manual-install](https://github.com/creationix/nvm#manual-install)
      - windows 系统安装 nvm [https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)
      - Ubuntu 系统安装 nvm [https://github.com/creationix/nvm](https://github.com/creationix/nvm)

<br>

## 项目初始化 
> 身为程序员，初入江湖第一招：『Hello World』

<br>

首先，创建一个目录 `koa2-tutorial/` 用来存放我们的代码。然后开始初始化项目：

```js
// 创建 package.json 文件。该文件用于管理项目中用到一些安装包
npm init
```

项目初始化完成后，在创建的目录里，新建文件 `app.js` 并在里面写下：

```js
console.log('Hello World')
```

现在，我们的项目结构应该如下：

```txt
├── app.js
├── package.json
```

打开控制台，进入目录 `koa2-tutorial/` 并输入：

```js
node app.js
```

成功输出 `Hello World`，说明环境正常。至此，我们的准备工作完成。

下面我们会基于 `Koa2` 启动服务器。

<br>

## 启动服务器 

运行如下命令，安装 `Koa` （版本信息会自动保存在 `package.json` 中）

```js
npm i koa -S
```

重写 `app.js`，增加如下代码： 

```js
const Koa = require('koa')
const app = new Koa()

app.listen(3000, () => {
  console.log('server is running at http://localhost:3000')
})
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
  console.log('server is running at http://localhost:3000')
})
``` 

重启服务器并再次访问，这时页面将正常显示 `Hello World`。

<br>  

在增加的代码里面，用到了 `Koa` 的「中间件」，那么什么是「中间件」呢？下一节我们会为大家详细讲述。

<br>
