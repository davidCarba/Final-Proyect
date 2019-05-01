'use strict';

const express = require('express');

const getProducts = require('../controllers/shop/get-products');
const checkJwtToken = require('../controllers/session/check-jwt-token');
const searchProducts = require('../controllers/shop/search-products');

const router = express.Router();

router.get('/shop', checkJwtToken, getProducts);
router.get('/shop/search', checkJwtToken, searchProducts);

module.exports = router;
