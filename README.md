# [BETA] express-gerJs
Use gerJs library plus use the models to validate and reformat the input/ouput payload in the API.

Example : [https://github.com/dobobaie/example-express-gerjs-server](https://github.com/dobobaie/example-express-gerjs-server)  

Help us to improve the project by contributing 👥  

## ☁️ Installation

```
$ npm install gerjs-express
```

## 📝 Usage

Use [gerjs-core](https://github.com/dobobaie/gerJs) documentation to create `modelsAPI` file. 

### Initialization

Create a new instance :
  
Then create the models. [`Joi`](https://hapi.dev/family/joi/) is required. 

``` js
const modelsAPI = require("./models/models");
const gerJs = require("gerjs-express")({
  // same gerjs-core options | except `destinationPath` is not available
  exportTo: 'path/doc', // string ; optional
})(modelsAPI);
```

## ⚙️ GerJs initialization in Express side

``` js
const express = require("express");
const router = require("express-router");

const app = new express();

// please use all the middlewares before
app.use(gerJs.middleware()); // middleware to validate payload and reformat reponse | required

app.
  // routes...
  .get("/swagger", gerJs.expose()) // expose the swagger documentation | optional
  .get("*", (req, res, next) => next(boom.notFound()))
;

```

## 👥 Contributing

Please help us to improve the project by contributing :)  

## ❓️ Testing

Clone the repo and run from the project root:

```
$ npm install
$ npm test
```
