'use strict';

const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mysqlPool = require('../../../databases/mysql-pool');

async function validateData(payload) {
  const schema = {
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  };

  return Joi.validate(payload, schema);
}

async function login(req, res, next) {
  /**
   * Validate data with Joi
   */
  const accountData = { ...req.body };
  try {
    await validateData(accountData);
  } catch (e) {
    return res.status(400).send(e);
  }

  /**
   * Check if users exist in ddbb
   */
  try {
    const connection = await mysqlPool.getConnection();
    const sqlQuery = `SELECT
    PK_users_id, uuid, email, password, activated_at
    FROM users
    WHERE email = '${accountData.email}'`;

    // const result = connection.query(sqlQuery)[0]
    const [result] = await connection.query(sqlQuery);
    if (result.length === 1) {
      const userData = result[0];
      /*
      userData is this:
      {
  id: 23,
  uuid: 'fu66783b-59t4-76dv-bsf3-13d797b2f8e',
  email: 'davidTest@yopmail.com',
  password:
   '$2b$10$lW7xAAZSs2TnaX7Ua.7LGOa4bHpBQ53ig2TWRdS.EMB8XihVcckrO',
  activated_at: 2019-03-01T19:00:57.000Z
}
  */
      if (!userData.activated_at) {
        return res.status(403).send();
      }

      /**
       *Check if password ok
       */
      const passwordOk = await bcrypt.compare(accountData.password, userData.password);
      if (passwordOk === false) { // !passwordOk
        return res.status(401).send();
      }

      /**
       * Generate JWT token
       */
      const payloadJwt = {
        uuid: userData.uuid,
      };

      const jwtTokenExpiration = parseInt(process.env.AUTH_ACCESS_TOKEN_TTL, 10);
      const token = jwt.sign(payloadJwt, process.env.AUTH_JWT_SECRET, { expiresIn: jwtTokenExpiration });
      const response = {
        accessToken: token,
        expiresIn: jwtTokenExpiration,
      };

      return res.status(200).json(response);
    }

    return res.status(404).send();
  } catch (e) {
    console.log(e);
    return res.status(500).send(e.message);
  }
}

module.exports = login;
