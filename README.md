# 视图 Nunjucks 
> 彩虹是上帝和人类立的约，上帝不会再用洪水灭人。 

<br/>

客户端和服务端之间相互通信，传递的数据最终都会展示在视图中，这时候就需要用到『**模板引擎**』。 

<br/> 

## 什么是模板引擎？ 

模板引擎是为了使用户界面与业务数据分离而产生的，可以生成特定格式的文档。例如，用于网站的模板引擎会生成一个标准的 `HTML` 文档。 

<br/> 

市面上常见的模板引擎很多，例如：`Smarty`、`Jade`、`Ejs`、`Nunjucks` 等，可以根据个人喜好进行选择。`koa-views`、`koa-nunjucks-2` 等支持 `Koa` 的第三方中间件也可以自行选择。 

<br/>

本项目中，我们使用 `koa-nunjucks-2` 作为模板引擎。`Nunjucks` 是 `Mozilla` 开发的，纯 `js` 编写的模板引擎，既可以用在 `Node` 环境下，也可以运行在浏览器端。`koa-nunjucks-2` 是基于 `Nunjucks` 封装出来的第三方中间件，完美支持 `Koa2`。 

<br/>

## Nunjucks 介绍 

首先我们需要了解 `Nunjucks` 的几个特性 

### 简单语法 

<br/> 

变量 

```js
  {{ username }}

  {{ foo.bar }}
  {{ foo["bar"] }}
``` 

如果变量的值为 `undefined` 或 `null` ，将不予显示。 

<br/>  

过滤器 

```js
  {{ foo | title }}
  {{ foo | join(",") }}
  {{ foo | replace("foo", "bar") | capitalize }}
```

<br/> 

`if` 判断 

```js
  {% if variable %}
    It is true
  {% endif %}

  {% if hungry %}
    I am hungry
  {% elif tired %}
    I am tired
  {% else %}
    I am good!
  {% endif %}
``` 

<br/> 

`for` 循环 

```js 
  var items = [{ title: "foo", id: 1 }, { title: "bar", id: 2}]
``` 

```js
  <h1>Posts</h1>
  <ul>
  {% for item in items %}
    <li>{{ item.title }}</li>
  {% else %}
    <li>This would display if the 'item' collection were empty</li>
  {% endfor %}
  </ul>
```

<br/> 

`macro` 宏 

宏：定义可复用的内容，类似于编程语言中的函数 

```js
  {% macro field(name, value='', type='text') %}
  <div class="field">
    <input type="{{ type }}" name="{{ name }}"
          value="{{ value | escape }}" />
  </div>
  {% endmacro %}
``` 

接下来就可以把 `field` 当作函数一样使用： 

```js
  {{ field('user') }}
  {{ field('pass', type='password') }}
``` 

<br/> 

更多语法内容请查阅[官方文档](http://mozilla.github.io/nunjucks/cn/templating.html) 

<br/> 

### 继承功能 

<br/> 

网页常见的结构大多是头部、中间体加尾部，同一个网站下的多个网页，头部和尾部内容通常来说基本一致。于是我们可以采用**继承**功能来进行编写。 

<br/> 

先定义一个 `layout.html` 

```js
  <html>
    <head>
      {% block head %}
      <link rel="stylesheet">
      {% endblock %}
    </head>  
    <body>
      {% block header %}
      <h1>this is header</h1>
      {% endblock %}

      {% block body %}
      <h1>this is body</h1>
      {% endblock %}

      {% block footer %}
      <h1>this is footer</h1>  
      {% endblock %}

      {% block content %}
      <script>
        //this is place for javascript
      </script>
      {% endblock %}
    </body>
  </html>
``` 

`layout` 定义了五个模块，分别命名为：`head`、`header`、`body`、`footer`、`content`。`header` 和 `footer` 是公用的，因此基本不动。业务代码的修改只需要在 `body` 内容体中进行、业务样式表和业务脚本分别在头部 `head` 和底部 `content` 中引入。 

<br/> 

接下来我们再定义一个业务级别的视图页面：`home.html` 

```html
  {% extends 'layout.html' %}

  {% block head %}
  <link href="home.css">
  {% endblock %}

  {% block body %}
  <h1>home 页面内容</h1>
  {% endblock %}

  {% block content %}
  <script src="home.js"></script>
  {% endblock%}
```

<br/>

最终的 `home.html` 输出后如下所示： 

```html
  <html>
    <head>
      <link href="home.css">
    </head>  
    <body>
      <h1>this is header</h1>

      <h1>home 页面内容</h1>

      <h1>this is footer</h1>  

      <script src="home.js"></script>
    </body>
  </html>
```

<br/>

### 安全性 

请对特殊字符进行转义，防止 `Xss` 攻击。若在页面上写入 `Hello World<script>alert(0)</script>` 这类字符串变量，并且不进行转义，页面渲染时该脚本就会自动执行，弹出提示框。  

<br/> 

## 安装并运行 

安装 `koa-nunjucks-2`: 

```js
npm i koa-nunjucks-2 -S
``` 

<br/>

修改 `app.js`，引入中间件，并指定存放视图文件的目录 `views`： 

```js
  const Koa = require('koa')
  const path = require('path')
  const bodyParser = require('koa-bodyparser')
  const nunjucks = require('koa-nunjucks-2')

  const app = new Koa()
  const router = require('./router')

  app.use(nunjucks({
    ext: 'html',
    path: path.join(__dirname, 'views'),// 指定视图目录
    nunjucksConfig: {
      trimBlocks: true // 开启转义 防Xss
    }
  }));

  app.use(bodyParser())
  router(app)
  app.listen(3000, () => {
    console.log('server is running at http://localhost:3000')
  })
``` 

<br/> 

在之前的项目中，视图被写在了 `controller/home` 里面，现在我们把它迁移到 `views` 中： 

新建 `views/home/login.html`:

```html
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <title></title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>

  <body>
    <form action="/user/register" method="post">
      <input name="name" type="text" placeholder="请输入用户名：ikcamp" />
      <br/>
      <input name="password" type="text" placeholder="请输入密码：123456" />
      <br/>
      <button>{{btnName}}</button>
    </form>
  </body>

  </html>
``` 

<br/> 

重写 `controller/home` 中的 `login` 方法： 

```js
  login: async(ctx, next) => {
    await ctx.render('home/login',{
      btnName: 'GoGoGo'
    })
  },
``` 

**注意：** 这里我们使用了 `await` 来异步读取文件。因为需要等待，所以必须保证读取文件之后再进行请求的响应。 

<br/>

增加了 `views` 层之后，视图功能还不算完善，我们还需要增加静态资源目录。当然，如果能直接使用静态服务器的话更好。下一节中，我们将讲述下如何增加静态文件及美化项目视图。 