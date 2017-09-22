const path = require("path")
const controllerCache = new Map();
const co = require("co")
const minifier = require('html-minifier').minify
const nunjucks = require('nunjucks')
const getController = (rootControllerPath, controllerPath) => {
    if (controllerCache.has(controllerPath)) {
        return Promise.resolve(controllerCache.get(controllerPath))
    } else {
        return findController(rootControllerPath, controllerPath)
    }
}
const findController = (rootControllerPath, controllerPath) => {
    return new Promise((resolve, reject) => {
        let array = controllerPath.split(".");
        let cPath;
        if (array.length < 2) {
            reject(new Error(`The controller with path ${rootControllerPath} should like 'xxx.xxx'`))
        } else {
            let controllerName = array.slice(0, array.length - 1).join('/')
            cPath = path.join(rootControllerPath, controllerName)
            let controller = require(cPath)
            let action = controller[array[array.length - 1]]
            if (action) {
                let data = {
                    action,
                    controller: controllerName
                }
                controllerCache.set(controllerPath, data)
                resolve(data)
            } else {
                reject(new Error(`The action with path ${controllerPath} not found`))
            }
        }
    })
}
/**
 * koa render 中间件，使用co-views渲染页面。依据`aconite-router`获取的路由信息，获取controller和view渲染页面。
 
 * @method koa-render
 * @param {Object} options - 初始化中间件参数
 * @param {string} options.rootControllerPath - controller的根路径
 * @param {string} options.viewRootPath - view的根路径
 * @param {Object} options.renderConfig - 渲染器的配置项，默认采用nunjucks渲染，可以自行制定渲染引擎
 * @param {String} options.renderConfig.ext - view的文件扩展名
 * @param {Function} options.renderConfig.renderFn - 自定义渲染，当不采用默认提供的nunjucks时，设置该回调
 * @param {Object} options.minifyHTMLConfig - 最小化HTML的配置项，采用`html-minifier`组件最小化HTML代码
 * @param {bool} options.minifyHTMLConfig.enable - 是否启用HTML最小化
 * @param {Object} options.minifyHTMLConfig.options - `html-minifier`组件的配置项
 */
module.exports = (options) => {
    options = Object.assign({
        // coViewConfig: { map: { html: "nunjucks" } },
        renderConfig: {
            ext: '.html',
            renderFn: null
        },
        minifyHTMLConfig: {
            enable: false,
            options: {
                removeComments: true,
                removeEmptyAttributes: true,
                removeEmptyElements: true,
                removeTagWhitespace: true,
                removeAttributeQuotes: true,
                collapseWhitespace: true
            }
        }
    }, options)
    const { rootControllerPath, viewRootPath, coViewConfig, minifyHTMLConfig, renderConfig } = options
    const { ext, renderFn } = renderConfig
    if (!rootControllerPath || !viewRootPath) {
        throw new Error("The options argument should like options:{rootControllerPath:'',viewRootPath:''}")
    }
    const defaultViews = (viewRootPath, renderConfig) => {
        const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(viewRootPath, renderConfig))
        return (viewname, data) => {
            return new Promise((resolve, reject) => {
                env.render(viewname + ext, data, (err, res) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                })
            })
        }
    }
    let render
    if (renderFn) {
        render = renderFn(viewRootPath, renderConfig)
    } else {
        render = defaultViews(viewRootPath)
    }
    const view = function (viewPath) {
        this.state.scope.__renderTime = new Date();
         return render(path.join(this.state.controller, viewPath), this.state.scope).then(body => {
            if (minifyHTMLConfig.enable) {
                body = minifier(body, minifyHTMLConfig.options);
            }
            this.body = body;
            this.state.scope = null;
        })
    }
    return (context, next) => {
        return next().then(() => {
            if (context.body) {
                return
            }
            if (!(context.routerInfo && context.routerInfo.length)) {
                return context.throw(404)
            }
            context.render = view.bind(context)
            context.say = "hello world"
            let koaRouter = context.routerInfo.filter((item) => {
                return item.type === "koa"
            })[0]
            if (koaRouter) {
                let controllerPath = koaRouter.data.controller
                return getController(rootControllerPath, controllerPath).then((actionData) => {
                    let { action, controller } = actionData
                    context.state.controller = controller
                    let fn = co.wrap(action).bind(context)
                    return fn(context.state.scope)
                })
            } else {
                return context.throw(404)
            }
        })
    }
}