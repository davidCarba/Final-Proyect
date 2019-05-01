'use strict';

const jwt = require('jsonwebtoken');

async function checkJwtToken(req, res, next) {
  /**
   * Validate authorization token
   *  JWT here_jwt_token_value
   */
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send();
  }

  // .startsWith('JWT ');
  const [prefix, token] = authorization.split(' '); // [JWT, quwrioquwoerquweroqweu]
  if (prefix !== 'JWT') {
    return res.status(401).send();
  }

  if (!token) {
    return res.status(401).send();
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET);

    if (!decoded) {
      return res.status(401).send();
    }

    req.claims = {
      uuid: decoded.uuid,
    };

    return next();
  } catch (e) {
    return res.status(401).send();
  }
}

module.exports = checkJwtToken;
