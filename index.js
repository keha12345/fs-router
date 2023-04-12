const fs = require('fs');
const p = require('path');

module.exports.Router = class Router{
    #ctx = null;
    /**
     * 
     * @param {{method: Function|[Function],}} controllers - { get: async (cxt) => {...} }
     * @param {Function|[Function]} checkCb - middleware or array of middlewaries
     */
    constructor(controllers, checkCb = null){
        this.controllersObj = controllers;
        this.checkCb = checkCb;
    }
    _getController(method){
        return  async (...args)=>{
                const functions = [];
                if(typeof this.checkCb === 'function') functions.push(this.checkCb);
                if(Array.isArray(this.checkCb)) functions.push(...this.checkCb);
                if(typeof this.controllersObj[method] === 'function') functions.push(this.controllersObj[method]);
                if(Array.isArray(this.controllersObj[method])) functions.push(...this.controllersObj[method]);
                this.#ctx = args;
                const result = await this.#call(functions);
                this.#ctx = null;
                return result
        }
    }

    async #call(functions){
        for(let func of functions){
            const result = await (new Promise(async res => {
                let next = null
                const result = await func(...this.#ctx, ()=>{
                    next = 1;
                    res();
                });
                if(!next) res(result);
            }));
            if(result) return result;
        }
    }
}


/**
 * 
 * @param {String} path - path to folder with controllers
 * @param {String} dirname - it is __dirname 
 * @returns {Function} middleware callback from koa app
 */
module.exports.koa = function(path,dirname){
    const routes = getRoutes(path,dirname);
    return async  (cxt, next) => {
        if(routes[cxt.request.url.split('?')[0]]){
            const requirePath = p.join(dirname,routes[cxt.request.url.split('?')[0]]);
            if(requirePath) {
                const router = require(requirePath);
                if(router instanceof module.exports.Router) {
                    const cb = router._getController(cxt.request.method.toLowerCase());
                    if(cb && typeof cb === 'function'){
                            let result = await cb(cxt);
                            if(result) cxt.body = result;
                        return;
                    }
                }
            }
        }
        // cxt.body = '...oooups! resourse not found!'
        // cxt.status = 404;
        await next();
    }
}

/**
 * 
 * @param {String} path - path to folder with controllers
 * @param {String} dirname - it is __dirname 
 * @returns {Function} middleware callback from express app
 */
module.exports.express = function(path,dirname){
    const routes = getRoutes(path,dirname);
    return async  (req, res, next) => {
        if(routes[req.path]){
            const requirePath = p.join(dirname,routes[req.path]);
            if(requirePath) {
                const router = require(requirePath);
                if(router instanceof module.exports.Router) {
                    const cb = router._getController(req.method.toLowerCase());
                    if(cb && typeof cb === 'function'){
                        try {
                            let result = await cb(req, res)
                            if(typeof result === 'object') res.json(result);
                            else if(result) res.send(result);
                        } catch (error) {
                            if(error?.message?.includes('forbidden')){
                                res.status(403).send('...oooups! resourse forbidden!');
                            }
                            else throw Error(`${requirePath}
                            Method ${req.method.toLowerCase()} has an error: ${error.message} \n`);
                        }
                        return;
                    }
                }
            }
        }
        // res.status(404).send('...oooups! resourse not found!');
        next();
    }
}

function getRoutes(link,dirname){
   try {
        return getRoutesObj(link,dirname)
        .reduce((acc, el)=>({
            ...acc,
            [el.split(link.replace('./',''))[1].replace('.js','')]: './'+el
        }),{})
   } catch (error) {
        throw Error(`Incorrect path "${link}"\n or dirname "${dirname}" \n`)
   }
}

function getRoutesObj(link,dirname){
    const routes= [];
    for(let el of fs.readdirSync(p.join(dirname,link))){
        try {
            routes.push(...routes,...getRoutesObj(p.join(link,el),dirname));
        } catch {
            routes.push(...routes, p.join(link,el));
        }
    }
    return routes
}

