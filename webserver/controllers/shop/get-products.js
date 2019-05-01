'use strict';

const ProductModel = require('../../../models/product-model');

async function getProducts(req, res, next) {
  const productProfile = await ProductModel.find();

  console.log('user profile', productProfile);

  return res.status(200).send(productProfile);
}

module.exports = getProducts;
