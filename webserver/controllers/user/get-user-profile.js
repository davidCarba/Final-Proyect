'use strict';

const UserModel = require('../../../models/user-model');

async function getUserProfile(req, res, next) {
  const { uuid } = req.claims;

  const userProfile = await UserModel.findOne({ uuid });

  console.log('user profile', userProfile);

  return res.status(200).send(userProfile);
}

module.exports = getUserProfile;
