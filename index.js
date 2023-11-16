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
exports.router = (path) => {
    const roots = getRoots(path);
    return async (...args) => {
        // async (ctx, next) => {

        let reqStr = ctx.request.href.replace( ctx.request.origin,'')
        reqStr = 
        reqStr.includes('/?')? reqStr.split('/?')[0]: 
        reqStr.includes('?')? reqStr.split('?')[0] : 
        reqStr;
        const root = roots[reqStr];
        // console.log(reqStr, roots, roots[reqStr]);
        if(!root && args.length === 2) return args[0].response.status = 404; 
        if(!root && args.length === 3) return args[1].sendStatus(404); 
        return await root[args.length === 2? '_koaHandler' : '_expressHandler'](...args);
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
     */
    constructor(methods, defenders=[]){ 
        this.methods = methods;
        this.defenders = defenders;
    }

    async _koaHandler(ctx, next) {
        try {
            for( let middleware of this.defenders){
                const result = await ( new Promise((res) => middleware(ctx, async ()=> {res('next')}).then(() => res('no'))))
                if(result !== 'next') return;
            }
            for(let controller of this.methods[ctx.request.method.toUpperCase()]){
                const result = await ( new Promise((res) => controller(ctx, async ()=> {res('next')}).then(() => res('no'))))
                if(result !== 'next') return;
            }
            return await next()
        } catch (error) {
            ctx.log(error.message, 'error');
            ctx.status = 500;
            return;
        }
    }

    async _expressHandler(request, response, next) {
        try {
            for( let middleware of this.defenders){
                const result = await ( new Promise((res) => middleware(request, response, async ()=> {res('next')}).then(() => res('no'))))
                if(result !== 'next') return;
            }
            for(let controller of this.methods[ctx.request.method.toUpperCase()]){
                const result = await ( new Promise((res) => controller(request, response, async ()=> {res('next')}).then(() => res('no'))))
                if(result !== 'next') return;
            }
            return await next()
        } catch (error) {
            ctx.log(error.message, 'error');
            ctx.status = 500;
            return;
        }
    }
}

function getRoots(direction, prefix='/'){
    return fs.readdirSync(direction+prefix)
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
