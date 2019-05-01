'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  uuid: {
    type: String,
    unique: true,
  },
  fullName: String,
  email: String,
  address: String,
  cp: Number,
});

userSchema.index(
  {
    fullName: 'text',
    address: 'text',
  },
);

const User = mongoose.model('User', userSchema);

module.exports = User;
