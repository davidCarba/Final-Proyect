'use strict';

const Joi = require('joi');
const ProductModel = require('../../../models/product-model');

/**
 * Validate if search data is valid
 * @param {Object} payload Object to be validated. { q: String to search }
 * @return {Object} null if data is valid, throw an Error if data is not valid
 */
async function validate(payload) {
  const schema = {
    q: Joi.string().max(128).required(),
  };

  return Joi.validate(payload, schema);
}

async function searchProducts(req, res, next) {
  const { q } = req.query;

  try {
    await validate({ q });
  } catch (e) {
    return res.status(400).send(e);
  }

  const op = {
    $text: {
      $search: q,
    },
  };

  const score = {
    score: {
      $meta: 'textScore',
    },
  };

  try {
    const products = await ProductModel.find(op, score).sort(score).lean();

    const productInfo = products.map((productResult) => {
      const {
        id,
        name,
        price,
        cp,
        score,
      } = productResult;

      return {
        id,
        name,
        price,
        cp,
        score,
      };
    });

    return res.send(productInfo);
  } catch (e) {
    return res.status(500).send(e.message);
  }
}

module.exports = searchProducts;
