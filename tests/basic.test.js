process.env.NODE_ENV = "development";
process.env.SERVER_IP = "localhost";
process.env.SERVER_PORT = 5050;
process.env.LOCALE = "en";
process.env.AUTH_TOKEN = "abc";

const test = require('ava');
const request = require('ava-http');
const gerjsTestExpress = require('gerjs-test-express');

const server_url = `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}`;

test("Server initialization", t =>
  new Promise((resolve, reject) =>
    gerjsTestExpress.modules.server.listen(
      gerjsTestExpress.app.config.server_port,
      () => resolve(
        `Server listening at ${gerjsTestExpress.app.config.server_port}`
      )
    )
  )
  .then(m => t.pass(m))
  .catch(m => t.fail(m))
);
