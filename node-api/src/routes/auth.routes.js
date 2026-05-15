const express = require('express');
const authController = require('../controllers/auth.controller');
const { jwtAuth } = require('../middleware/jwt.middleware');

const router = express.Router();

router.post('/auth/login', authController.login);
router.get('/auth/me', jwtAuth, authController.me);

module.exports = router;
