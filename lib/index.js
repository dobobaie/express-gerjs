const fs = require('fs');
const gerJsCore = require('@gerjs/core');
const {
  getContentTypeFromExtension,
  retrieveContentType,
  exportDirectory,
  matchRoute
} = require('./utils');

const swaggerConfig = {
  directory: __dirname + '/../swagger/'
};

const executeGerJsCore = (options, models) =>
  gerJsCore(
    Object.assign({}, options, {
      destinationPath: swaggerConfig.directory
    })
  )(models).then(() =>
    options.exportTo
      ? exportDirectory(swaggerConfig.directory, options.exportTo)
      : true
  );

const renderSwaggerFile = (req, res) => {
  const extension = req.url.split('.').pop();
  res.setHeader('Content-Type', getContentTypeFromExtension(extension));
  res.send(fs.createReadStream(swaggerConfig.directory + ctx.request.url));  
};

const configExpressRouter = options => (res, response) => {
  res._sendByExpressGerJs = res.send;
  res.send = function(data) {
    const { value, error } = response
      .options({ stripUnknown: true })
      .validate(data);
    if (error) {
      throw new Error(error);
    }
    const contentType = retrieveContentType(response.type, response['$_terms'].metas);
    res.setHeader('Content-Type', contentType);
    res._sendByExpressGerJs(value);
  };
};

const swaggerListFiles = fs.readdirSync(swaggerConfig.directory).map(file => '/' + file);
const middleware = options => models => () =>  {
  const listModels = Object.keys(models);
  return (req, res, next) => {
    if (swaggerListFiles.includes(req.url)) {
      return renderSwaggerFile(req, res);
    }
  
    const routeKey = matchRoute(listModels)({
      method: req.method,
      url: req.url.split('?').shift()
    });
    if (routeKey === undefined) {
      return next();
    }

    const route = listModels[routeKey];
    
    if (models[route].queries) {
      const { value, error } = models[route].queries.validate(req.query);
      if (error) {
        throw new Error(error);
      }
      req.query = Object.assign({}, value);
    }

    if (models[route].body) {
      const payload = req.body || {};
      const { value, error } = models[route].body.validate(payload);
      if (error) {
        throw new Error(error);
      }
      req.body = Object.assign({}, value);
    }

    configExpressRouter(options)(res, models[route].response);

    next();
  };
};

const expose = (options, gerJs) => () => (req, res) => 
  gerJs
    .then(() => {
      res.setHeader('Content-Type', 'text/html');
      res.send(fs.createReadStream(swaggerConfig.directory + '/index.html'));
    });

module.exports = options => models => {
  const opt = options || {};
  const gerJs = executeGerJsCore(options, models);
  return {
    middleware: middleware(options)(models),
    expose: expose(options, gerJs)
  };
};
