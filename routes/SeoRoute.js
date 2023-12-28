const express = require('express');
const seoController = require('../controllers/SeoController');
const router = express.Router();

router.post('/analyze', seoController.postSeoUrl);

module.exports = router;
