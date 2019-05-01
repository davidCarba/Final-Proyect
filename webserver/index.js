'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
let server = null;
app.use(bodyParser.json());

/**
 * Enable CORS with a origin whitelist of valid domains
 * Step 1: Add CORS
 */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Access-Control-Allow-Methods: put accessControlAllowHeaders separated by comma
  res.header(
    'Access-Control-Allow-Methods', '*'
  );
  // put accessControlAllowHeaders separated by comma
  res.header(
    'Access-Control-Allow-Headers', '*'
  );
  next();
});

/**
 * Add all routes
 */
app.use('/api', routes.accountRouter);
app.use('/api', routes.userRouter);
app.use('/api', routes.shopRouter);

app.use('*', (req, res, next) => res.status(404).send({
  message: 'Se siente, tus amigos no están aquí',
}));

/**
 * Special route middleware to catch all next(err) generated by controllers
 */
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).send(err);
  }

  if (err.name === 'AuthenticatedError') {
    return res.status(401).send();
  }

  console.error('Error 500', err);
  return res.status(500).send({
    message: err.message,
  });
});

/**
 * Start listening requests at a given port
 * @param {Number} port
 */
async function listen(port) {
  if (server === null) {
    server = await app.listen(port);
  } else {
    console.error("Can't listen, server already initialized");
  }
}

/**
 * Stop listening requests
 */
async function close() {
  if (server) {
    await server.close();
    server = null;
  } else {
    console.error("Can't close a non started server");
  }
}

module.exports = {
  listen,
  close,
};
