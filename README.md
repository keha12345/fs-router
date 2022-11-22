# fs_router
it is a router from koa and express servers with suport of roots from fs path
# [fs_router](https://github.com/keha12345/fs-router)

> Router middleware for [Koa](https://github.com/koajs/koa). Maintained by [Forward Email][forward-email] and [Lad][].
[![license](https://img.shields.io/github/license/koajs/router.svg)](LICENSE)


## Table of Contents

* [Features](#features)
* [Install](#install)
* [Description](#description)
* [Exemples](#exemples)
* [Future](#future)
* [License](#license)


## Features

* Automatic root generation
* Protected router from an accidental call
* `async/await` support

## Install

[npm][]:

```sh
npm install fs_router
```


## Description

You can get automatic root controllers in the file system

```
routers
    foo
        bar.js
        baz.js
    other.js
```
you will get root:
/foo/bar
/foo/baz
/other


## Exemples

### for a Koa
```index.js
const Koa = require("koa");
const cors = require("@koa/cors");
const router = require('fs_router').koa;
const app = new Koa();

app.use(parser())
  .use(cors())
  .use(router('routers',__dirname))
  .listen(8000, () => {
    console.log(`🚀 on port:${8000}`);
  });
```

```controller.js
const Router = require('fs_router').Router

module.exports = new Router({
        get: (cxt) => {return `hello ${cxt.method}`},
        post: async (cxt) => {
            await cxt.db.model.create(object)
            return 'ok'
        }
    },
    (cxt) => { if(!cxt.session) throw Error('auth failed')}
)
```


## Future

| Name             |
| ---------------- |
| **Alex Mingoia** |
| **@koajs**       |


## License

[MIT](LICENSE) © Kirill Kukuliev


##

Thank a million!
