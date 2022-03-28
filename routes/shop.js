const express = require("express");
const path = require("path");

const shopController = require("../controllers/shop");

const isAuth = require('../middleware/isAuth');

const router = express.Router();

// INDEX
router.get("/", shopController.getIndex);

// All Products
router.get("/products", shopController.getProducts);

// Product details page
router.get("/products/:productId", shopController.getProduct);

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart", isAuth, shopController.postCart);

router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/checkout/success', isAuth, shopController.getCheckoutSuccess);

router.get('/checkout/cancel', isAuth, shopController.getCheckout);

router.get("/orders", isAuth, shopController.getOrders);

router.post("/create-order", isAuth, shopController.postOrder);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
