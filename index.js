const fs = require('fs');
const p = require('path');

module.exports.Router = class Router{
    /**
     * 
     * @param {{method: Function,}} controllers - example { get: (cxt) => {...} }
     * @param {Function} checkCb - middleware, calls to next() automaticly, you should to throw if resurse forbidden
     */
    constructor(controllers, checkCb = null){
        this.controllersObj = controllers;
        this.checkCb = checkCb;
    }
    _getCbs(){
        return Object.keys(this.controllersObj)
        .reduce((acc, el) => ({
            ...acc, 
            [el]: (...args)=>{
                try {
                    if(typeof this.checkCb === 'function') this.checkCb(...args);
                } catch (error) {
                    throw Error('forbidden');
                }
                return this.controllersObj[el](...args);
        }}),{})
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
                    const cb = router._getCbs()[cxt.request.method.toLowerCase()]
                    if(cb && typeof cb === 'function'){
                        try {
                            let resp = cb(cxt, next)
                            if(resp instanceof Promise) resp = await resp;
                            if (resp instanceof Object) cxt.body = JSON.parse(resp);
                            else cxt.body = resp;
                        } catch (error) {
                            if(error?.message?.includes('forbidden')){
                                cxt.body = '...oooups! resourse forbidden!'
                                cxt.status = 403;
                            }
                            else throw Error(`${requirePath}
                            Method ${cxt.request.method.toLowerCase()} has an error: ${error.message} \n`);
                        }
                        return;
                    }
                }
            }
        }
        cxt.body = '...oooups! resourse not found!'
        cxt.status = 404;
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
                    const cb = router._getCbs()[req.method.toLowerCase()]
                    if(cb && typeof cb === 'function'){
                        try {
                            let resp = cb(req, res, next)
                            if(resp instanceof Promise) resp = await resp;
                            if (resp instanceof Object) res.json(resp);
                            else res.send(resp);
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
        res.status(404).send('...oooups! resourse not found!');
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

