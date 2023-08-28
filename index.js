const fs = require('fs');
const path = require('path');

/**
 * 
 * @param {string} path - path of roots folder  
 * @returns function - combiner of controllers
 * @example
 * 
 * app.use(router(__dirname+'/roots'));
 * 
 */
exports.koa = (path) => {
    const roots = getRoots(path);
    return async (ctx, next) => {
        let reqStr = ctx.request.href.replace( ctx.request.origin,'')
        reqStr = 
        reqStr.includes('/?')? reqStr.split('/?')[0]: 
        reqStr.includes('?')? reqStr.split('?')[0] : 
        reqStr;
        const root = roots[reqStr];
        // console.log(reqStr, roots, roots[reqStr]);
        if(!root) return ctx.response.status = 404; 
        return await root._koaHandler(ctx, next);
    }
}

/**
 * 
 * @param {string} path - path of roots folder  
 * @returns function - combiner of controllers
 * @example
 * 
 * app.use(router(__dirname+'/roots'));
 * 
 */
exports.express = (path) => {
    const roots = getRoots(path);
    return async (request, res, next) => {
        let reqStr = request.href.replace( request.origin,'')
        reqStr = 
        reqStr.includes('/?')? reqStr.split('/?')[0]: 
        reqStr.includes('?')? reqStr.split('?')[0] : 
        reqStr;
        const root = roots[reqStr];
        // console.log(reqStr, roots, roots[reqStr]);
        if(!root) return ctx.response.status = 404; 
        return await root._expressHandler(request, res, next);
    }
}

exports.Root = class Root {
    /**
     * @param {object} methods - object of arrays of middlewares {GET: [],POST: [],CREATE: [],DELETE: []}
     * @param {Array} methods.GET - array of functions // async (ctx) => ctx.body= 'hello'
     * @param {Array} defenders - array of middlewares
     * @returns {Root} a instance of root
     * 
     * @example 
     *  
     * module.exports = new Root({ 
     *  GET: [
     *      middlewareFunction,
     *      async (ctx,next) => {
        *      ctx.body = hello;
        *      await next();
     *      },
     *      anotherMiddlewareFunction
     *  ],
     *  DELETE: [ async (ctx,next) => {
        *      ctx.body = 'something deleted';
        *      await next();
     *      }]
     * },
     * [checkUserMiddleware, checkSomthingElse]
     * )
     * 
     * OR
     * 
     * module.exports = new Root({ 
     *  GET: [
     *      middlewareFunction,
     *      async (req,res,next) => {
        *      req.sesion.hello = hello;
        *      next();
     *      },
     *      sendHelloFunction
     *  ],
     *  DELETE: [ async (req,res,next) => {
        *      console.log('something deleted');
        *      res.status(200).end()
     *      }]
     * },
     * [checkUserMiddleware, checkSomthingElse]
     * )
     */
    constructor(methods, defenders=[]){ 
        this.methods = Object.keys(methods).map(k => Array.isArray(methods[k])?methods[k] : [methods[k]]);
        this.defenders = defenders;
    }

    async _koaHandler(ctx, next) {
        try {
            for( let middleware of this.defenders){
                let next = false;
                await middleware(ctx, async () => {next=true});
                if(!next) return;
            }
            for(let controller of this.methods[ctx.request.method.toUpperCase()]){
                let next = false;
                await controller(ctx, async ()=> {next=true});
                if(!next) return;
            }
            return await next()
        } catch (error) {
            console.log(error.message);
            ctx.status = 500;
            return;
        }
    }

    async _expressHandler(req, res, next) {
        try {
            for( let middleware of this.defenders){
                let next = false;
                await middleware(req, res, async () => {next=true});
                if(!next) return;
            }
            for(let controller of this.methods[req.method.toUpperCase()]){
                let next = false;
                await controller(req, res, async ()=> {next=true});
                if(!next) return;
            }
            return next()
        } catch (error) {
            console.log(error.message);
            ctx.status = 500;
            return;
        }
    }
}

function getRoots(direction, prefix='/'){
    return fs.readdirSync(path.join(__dirname,direction+prefix))
    .map(file => {
        if(file.includes('.js')){
            const controller = require(direction+prefix+file)
            if(!(controller instanceof exports.Root)) return {};
            return {[prefix+file.split('.js')[0]]: controller}
        }else{
            return getRoots(direction, prefix+file+'/')
        }
    })
    .reduce((acc,root)=> ({...acc, ...root}),{});
}
