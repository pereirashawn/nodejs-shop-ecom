const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const adminController = require("../controllers/admin");

const isAuth = require('../middleware/isAuth');
const validator = require('../middleware/validator')

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post("/add-product", isAuth, validator.productValidator, adminController.postAddProduct);

// /admin/edit-product/:productId => GET
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth, validator.productValidator, adminController.postEditProduct);


router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
