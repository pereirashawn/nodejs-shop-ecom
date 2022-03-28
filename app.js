const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const fs = require("fs");
const https = require("https");

// const database = require("./utils/database");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ROUTES
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");

// MODELS/SCEHMA
const User = require("./models/user");

const app = express({});

// MULTER config
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetypr === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// MongoDB Store
const store = new MongoDbStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

const csrfProtection = csrf();

// Setting Template Engine
app.set("view engine", "ejs");
app.set("views", "views");

const logging = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

app.use(helmet());
app.use(compression());
app.use(
  morgan("combined", {
    stream: logging,
  })
);

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);

//Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// Session
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.name = req.session.isLoggedIn ? req.session.user.name : "Guest";
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (req.session.isLoggedIn) {
    req.session.user = new User().init(req.session.user);
  }
  next();
});

// Middlewares
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// const privateKey = fs.readFileSync('key.pem');

// const certificate = fs.readFileSync('csr.pem');

app.get("/500", errorController.error500);
// 404 Error Page Middleware
app.use(errorController.error404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("errors/error500", {
    pageTitle: "ERROR!!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
    message: error.message,
  });
});

mongoose
  .connect(process.env.DB_URL)
  .then((result) => {
    console.log("CONNECTED TO DATABASE");
    // https.createServer({
    //   key: privateKey,
    //   cert: certificate
    // },app).listen(process.env.PORT || 3000)

    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });

// Defining Associations
// Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
// User.hasMany(Product);

// User.hasOne(Cart);
// Cart.belongsTo(User);

// Cart.belongsToMany(Product, { through: CartItem });
// Product.belongsToMany(Cart, { through: CartItem });
