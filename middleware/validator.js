const { check, body } = require("express-validator");
const User = require("../models/user");

exports.signupValidator = [
  body("name", "Please enter valid Name of atleast 3 characters")
    .isLength({ min: 3 })
    .isAlpha()
    .trim(),
  check("email")
    .isEmail()
    .withMessage("Please enter valid email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (user) {
          return Promise.reject(
            "Email already exists. Please use a different email"
          );
        }
      });
    })
    .normalizeEmail(),
  body(
    "password",
    "Password should be combination of one uppercase , one lower case, one special char, one digit and min 8 , max 20 char long"
  )
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .trim(),
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Entered passwords do not match");
      }
      return true;
    })
    .trim(),

  (req, res, next) => {
    next();
  },
];

exports.loginValidator = [
  check("email").isEmail().withMessage("Please enter a valid Email").trim(),
  // .custom((value,{req}) => {
  //   return User.findOne({email: value})
  //     .then(user => {
  //       if(!user) {
  //         return Promise.reject('Invalid email or password')
  //       }
  //     })
  // })
  body("password", "Invalid email or password")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
    .trim(),

  (req, res, next) => {
    next();
  },
];

exports.productValidator = [
  body('title',
       'Title should contain atlest 3 characters')
    .isString()
    .isLength({min: 3})
    .trim(),
  body('price',
       'Please enter valid price')
    .isNumeric(),
  body('description',
       'Description should contain a minimum of 3 and maximum of 400 characters')
    .isString()
    .trim()
    .isLength({min: 3, max: 400}),

  (req,res,next) => {
    next();
  }

];
