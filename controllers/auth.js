const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const User = require("../models/user");

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PWD,
  },
});

exports.getLogin = (req, res, next) => {
  //   console.log("SESSION ", req.session);
  //   console.log("USER ", req.session.user);
  let message = req.flash("error");
  let infoMessage = req.flash("info");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  if (infoMessage.length > 0) {
    infoMessage = infoMessage[0];
  } else {
    infoMessage = null;
  }

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    infoMessage: infoMessage,
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      infoMessage: null,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: 'Invalid email or password',
          infoMessage: null,
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: [],
        });
      }
      bcrypt.compare(password, user.password).then((doMatch) => {
        if (doMatch) {
          // Passwords match
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);
            console.log("--- LOGIN SUCCESSFULL ---");
            res.redirect("/");
          });
        }
        // console.log('Entered Credentials Do Not Match. Please Try Again')
        return res.status(422).render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: 'Invalid email or password',
          infoMessage: null,
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: [],
        });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  let infoMessage = req.flash("info");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  if (infoMessage.length > 0) {
    infoMessage = infoMessage[0];
  } else {
    infoMessage = null;
  }

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMessage: message,
    infoMessage: infoMessage,
    oldInput: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        name: name,
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return newUser.save();
    })
    .then((result) => {
      console.log("--- USER CREATED ---");
      var mailOptions = {
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Account creation successfull",
        html: `<h1>
                      Welcome to Node-Shop
                  </h1>
                  <p>
                    Thank you for joining us. We hope you will have a great experience!!!
                  </p>`,
      };
      res.redirect("/login");
      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log("Email sent : " + info.response);
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  let infoMessage = req.flash("info");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  if (infoMessage.length > 0) {
    infoMessage = infoMessage[0];
  } else {
    infoMessage = null;
  }

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Password Reset",
    errorMessage: message,
    infoMessage: infoMessage,
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No User Found");
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // Expiration in 1 hour.
        return user.save();
      })
      .then((result) => {
        var mailOptions = {
          from: process.env.MAIL_FROM,
          to: email,
          subject: "Password Reset",
          html: `<h1>
                    Reset Your Password
                </h1>
                <p>
                  You requested a password reset.
                </p>
                <p>
                  Click this <a href="http://localhost:3000/reset/${token}">Link</a> to reset your password
                </p>`,
        };
        transport.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Email sent : " + info.response);
        });
        req.flash(
          "info",
          "Password reset email has been sent. Please check your mailbox"
        );
        res.redirect("/login");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: new Date() },
  }).then((user) => {
    if (!user) {
      req.flash(
        "error",
        "Oops! That reset password link has already been used. If you still need to reset your password, submit a new request."
      );
      return res.redirect("/login");
    }
    let message = req.flash("error");
    let infoMessage = req.flash("info");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    if (infoMessage.length > 0) {
      infoMessage = infoMessage[0];
    } else {
      infoMessage = null;
    }

    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      errorMessage: message,
      infoMessage: infoMessage,
      passwordToken: token,
      userId: user._id.toString(),
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  let resetUser;

  User.findOne({
    resetToken: req.body.passwordToken,
    resetTokenExpiration: { $gt: new Date() },
    _id: req.body.userId,
  })
    .then((user) => {
      console.log("USER : ", user);
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = null;

      return resetUser.save();
    })
    .then((result) => {
      req.flash("info", "Password changed successfully.");
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
