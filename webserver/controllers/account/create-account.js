'use strict';

const bcrypt = require('bcrypt');
const Joi = require('joi');
const sendgridMail = require('@sendgrid/mail');
const uuidV4 = require('uuid/v4');
const mysqlPool = require('../../../databases/mysql-pool');
const UserModel = require('../../../models/user-model');

sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 *Insert the user into the database generating an uuid and calculating the bcrypt password
 * @param {String} email
 * @param {String} password
 */
async function insertUserIntoDatabase(email, password) {
  const securePassword = await bcrypt.hash(password, 10);
  const uuid = uuidV4();
  const now = new Date();
  const createdAt = now.toISOString().substring(0, 19).replace('T', ' ');

  const connection = await mysqlPool.getConnection();

  await connection.query('INSERT INTO users SET ?', {
    uuid,
    email,
    password: securePassword,
    created_at: createdAt,
  });

  return uuid;
}

/**
 * Insert verification code in ddbb
 * @param {String} uuid
 * @param {String} verificationCode
 */
async function addVerificationCode(uuid) {
  const verificationCode = uuidV4();
  const now = new Date();
  const createdAt = now.toISOString().substring(0, 19).replace('T', ' ');
  const sqlQuery = 'INSERT INTO users_activation SET ?';
  const connection = await mysqlPool.getConnection();

  await connection.query(sqlQuery, {
    user_uuid: uuid,
    verification_code: verificationCode,
    created_at: createdAt,
  });

  connection.release();

  return verificationCode;
}

/**
 * Create de user in mongodb
 * @param {String} uuid
 * @param {String} email
 * @param {String} fullName
 * @param {String} address
 * @param {Number} cp
 */

async function createUserProfile(uuid, email, fullName, address, cp) {
  const userProfileData = {
    uuid,
    fullName,
    email,
    address,
    cp,
  };

  try {
    await UserModel.create(userProfileData);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Send an email with a verification link to the user to activate the account
 * @param {String} userEmail
 * @param {String} verificationCode
 */
async function sendEmailRegistration(userEmail, verificationCode) {
  const msg = {
    to: userEmail,
    from: {
      email: 'alvezinc@yopmail.com',
      name: 'Alvezinc S.L.',
    },
    subject: 'Bienvenido a Alvezinc S.L.',
    text: 'Gracias por registrarte',
    html: `To confirm the account/Para confirmar tu cuenta click <a href="${process.env.HTTP_SERVER_DOMAIN}/api/account/activate?verification_code=${verificationCode}">here/ aqui</a>`,
  };

  const data = await sendgridMail.send(msg);
  return data;
}

async function validateSchema(payload) {
  /**
   * email: Valid email
   * password: Letters (upper and lower case) and number
   *    Minimun 3 and max 30 characters, using next regular expression: /^[a-zA-Z0-9]{3,30}$/
   * fullName: String and required
   * address: String and required
   * cp: Number, required and a minimum of 5 digits
   */
  const schema = {
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
    fullName: Joi.string().required(),
    address: Joi.string().required(),
    cp: Joi.number().min(5).required(),
  };

  return Joi.validate(payload, schema);
}

async function create(req, res, next) {
  const accountData = { ...req.body };

  /**
   * Validate if user data is valid
   */
  try {
    await validateSchema(accountData);
  } catch (e) {
    // Create validation error
    return res.status(400).send(e);
  }

  const {
    email,
    password,
    fullName,
    address,
    cp,
  } = accountData;

  try {
    /**
     * Create user and send response
     */
    const uuid = await insertUserIntoDatabase(email, password);
    res.status(204).json();

    /**
     *Create structure in mongodb
     */
    await createUserProfile(uuid, email, fullName, address, cp);

    /**
     * Generate verification code and send email
     */
    try {
      const verificationCode = await addVerificationCode(uuid);
      await sendEmailRegistration(email, verificationCode);
    } catch (e) {
      console.error('Sengrid error', e);
    }
  } catch (e) {
    // create error
    next(e);
  }
}

module.exports = create;
