const fs = require("fs");
const path = require("path");
const PDFDocument = require('pdfkit')
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
//const Cart = require("../models/cart");

const ITEMS_PER_PAGE = 2;

// INDEX
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(num => {
      totalItems = num;
      return Product.find()
      .skip((page-1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "My Shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
        hasPrevPage: page > 1,
        nextPage: page+1,
        prevPage: page-1,
        lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// FETCH ALL PRODUCTS
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
  
    Product.find()
      .countDocuments()
      .then(num => {
        totalItems = num;
        return Product.find()
        .skip((page-1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
      })
      .then((products) => {
        res.render("shop/product-list", {
          prods: products,
          pageTitle: "All Products",
          path: "/products",
          isAuthenticated: req.session.isLoggedIn,
          totalProducts: totalItems,
          currentPage: page,
          hasNextPage: (ITEMS_PER_PAGE * page) < totalItems,
          hasPrevPage: page > 1,
          nextPage: page+1,
          prevPage: page-1,
          lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
        });
      })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// FETCH SINGLE PRODUCT
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.session.user
    .populate("cart.items.productId")
    // .execPopulate()
    .then((user) => {
      //console.log("populate: ", user.cart.items);
      return req.session.user.getCartProducts(user.cart.items);
    })
    .then((products) => {
      console.log("CART-PRODUCTS-GET-CART : ", products);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.session.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req,res,next) => {
  let products;
  let total=0;
  req.session.user
    .populate("cart.items.productId")
    // .execPopulate()
    .then((user) => {
      products = user.cart.items;
      total=0;
      products.forEach(p => {
        total += p.productId.price * p.quantity
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: products.map((p) => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: "usd",
              unit_amount: p.productId.price * 100,
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
            },
          };
        }),
        success_url: req.protocol +'://' +req.get('host') +'/checkout/success',
        cancel_url: req.protocol +'://' +req.get('host') +'/checkout/cancel'
      });
      //res.redirect(303,session.url);
    })
    .then(session => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
        totalSum: total,
        sessionId: session.id
      });
    }) 
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

}

exports.getCheckoutSuccess = (req,res,next) => {
  req.session.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: { ...i.productId._doc },
        };
      });

      const order = new Order({
        user: {
          name: req.session.user.name,
          userId: req.session.user,
        },
        products: products,
      });

      return order.save();
    })
    .then((result) => {
      console.log("-- ORDER PLACED SUCCESSFULLY --");
      return req.session.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.session.user
    .removeFromCart(prodId)
    .then((result) => {
      console.log("PRODUCT DELETED");
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.session.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.session.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: { ...i.productId._doc },
        };
      });

      const order = new Order({
        user: {
          name: req.session.user.name,
          userId: req.session.user,
        },
        products: products,
      });

      return order.save();
    })
    .then((result) => {
      console.log("-- ORDER PLACED SUCCESSFULLY --");
      return req.session.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  // Restricitng file access
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found"));
      }
  
      if (order.user.userId.toString() !== req.session.user._id.toString()) {
        return next(new Error("Unauthorized access"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     console.log(err);
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filename="' + invoiceName + '"'
      //   );

      //   res.send(data);
        
      // });

      // const file = fs.createReadStream(invoicePath);
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   'inline; filename="' + invoiceName + '"'
      // );
      // file.pipe(res)

      // Generating PDF using pdfkit
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type','application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename=" '+invoiceName+ '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text(`ORDER INVOICE`);
      pdfDoc.text(`-------------------------------------------------`);
      let totalPrice =0;

      order.products.forEach(prod => {
          totalPrice += prod.product.price*prod.quantity;
          pdfDoc.fontSize(14).text(`${prod.product.title} - $${prod.product.price} (Quantity : ${prod.quantity})`)
      })

      pdfDoc.text(`
      `);
      pdfDoc.text(`-------------------`)
      pdfDoc.fontSize(16).text(`Grand Total : $${totalPrice}`);
      // pdfDoc.text('TEST');
      pdfDoc.end();

    })
    .catch((err) => {
      return next(err);
    });
};

// exports.getCheckout = (req, res, next) => {
//   res.render("shop/checkout", {
//     path: "/checkout",
//     pageTitle: "Checkout",
//   });
// }
