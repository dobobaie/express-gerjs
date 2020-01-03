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
  let readStream = fs.createReadStream(swaggerConfig.directory + req.url);
  readStream.pipe(res);
  readStream.on('close', () => res.end());
};

const configExpressRouter = options => (res, response) => {
  let processed = false;
  res._sendByGerJs = res.send;
  res.send = function(data) {
    if (processed === true) {
      res._sendByGerJs(data);
      return this;
    }
    processed = true;
    const { value, error } = response
      .options({ stripUnknown: true })
      .validate(data);
    if (error) {
      throw new Error(error);
    }
    const contentType = retrieveContentType(response.type, response['$_terms'].metas);
    res.setHeader('Content-Type', contentType);
    res._sendByGerJs(value);
    return this;
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
      path: req.url.split('?').shift()
    });
    if (routeKey === undefined) {
      return next();
    }

    const route = listModels[routeKey];
    
    if (models[route].queries) {
      const { value, error } = models[route].queries.validate(req.queries);
      if (error) {
        throw new Error(error);
      }
      req.queries = Object.assign({}, value);
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
      let readStream = fs.createReadStream(swaggerConfig.directory + '/index.html');
      readStream.pipe(res);
      readStream.on('close', () => res.end());
    });

module.exports = options => models => {
  const opt = options || {};
  const gerJs = executeGerJsCore(options, models);
  return {
    middleware: middleware(options)(models),
    expose: expose(options, gerJs)
  };
};
