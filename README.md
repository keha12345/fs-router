
# [auto-roots](https://github.com/keha12345/fs-router)

this is a router for "koa" and "express" servers  
that creates root automatically!

[![license](https://img.shields.io/github/license/koajs/router.svg)](LICENSE)


## Table of Contents

* [Features](#features)
* [Install](#install)
* [Description](#description)
* [Koa Exemple](#koa-exemple)
* [Express Exemple](#express-exemple)
* [Future](#future)
* [License](#license)


## Features

* Automatic root generation
* Protected router from an accidental call
* `async/await` support

## Install

```sh
npm install auto-roots
```

## Description

You can get automatic root controllers in the file system

```
routers
├――――――foo
│      ├―――bar.js
│      └――baz.js
└―――――other.js
```

you will get roots:  
```  
  /foo/bar  
  /foo/baz  
  /other  
```

## Koa Exemple
Get middleware generation function ``const router = require('auto-roots').koa``  
Get the middleware function ``router(path, __dirname)``  

``index.js``
```index.js
const Koa = require("koa");
const cors = require("@koa/cors");
const router = require('auto-roots').koa;
const app = new Koa();

app.use(parser())
  .use(cors())
  .use(router('routers'))
  .listen(8000, () => {
    console.log(`🚀 on port:${8000}`);
  });
```

For the router to work, the controller file must return an instance of the router, otherwise it will be skipped.  
The router constructor can be obtained from  ``require('auto-roots').Router``  
This is done as a prevention of errors causing vulnerabilities. 


``controller.js``
```controller.js
const Root = require('auto-roots').Root

module.exports = new Root({ 
       GET: [
           middlewareFunction,
           async (ctx,next) => {
              ctx.body = hello;
              await next();
           },
           anotherMiddlewareFunction
       ],
       DELETE: [ async (ctx,next) => {
              ctx.body = 'something deleted';
              await next();
           }]
       },
       [checkUserMiddleware, checkSomthingElse]
      )
``` 
You can combine arrays or single functions inside one constructor.  

## Express Exemple
Get middleware generation function ``const router = require('auto-roots').express``  
Get the middleware function ``router(path)``  

``index.js``
```index.js
const express = require("express");
const cors = require("cors");
const router = require('auto-roots').express;
const app = express();

app.use(parser());
app.use(cors())
app.use(router('routers'))
app.listen(8000, () => {
    console.log(`🚀 on port:${8000}`);
  });
```

For the router to work, the controller file must return an instance of the router, otherwise it will be skipped.  
The router constructor can be obtained from  ``require('auto-roots').Router``  
This is done as a prevention of errors causing vulnerabilities. 


``controller.js``
```controller.js
module.exports = new Root({ 
      GET: [
          middlewareFunction,
          async (req,res,next) => {
            req.sesion.hello = hello;
            next();
          },
          sendHelloFunction
      ],
      DELETE: [ async (req,res,next) => {
            console.log('something deleted');
            res.status(200).end()
          }]
     },
     [checkUserMiddleware, checkSomthingElse]
     )
``` 

You can combine arrays or single functions inside one constructor. You can use to sync controllers functions. 


## Future

An important drawback that can be seen today is 
that the params are not available.  
Use query strings or http headers.  
This option will be added in future updates. 

## License

[MIT](LICENSE) © Kirill Kukuliev

##

Thank's a million!
