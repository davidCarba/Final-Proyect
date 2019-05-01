'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
  id: Number,
  name: String,
  price: String,
  cp: String,
});

productSchema.index(
  {
    id: 'number',
    name: 'text',
  },
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
