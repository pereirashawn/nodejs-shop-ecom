const express = require('express');
const {check} = require('express-validator');
const authController = require('../controllers/auth');
const validator = require('../middleware/validator');

const router = express.Router();

router.get('/login',authController.getLogin);

router.post('/login',validator.loginValidator,authController.postLogin);

router.get('/logout',authController.getLogout);

router.get('/signup',authController.getSignup);

router.post('/signup',validator.signupValidator,authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password',authController.postNewPassword);

module.exports = router;