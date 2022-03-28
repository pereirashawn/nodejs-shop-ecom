const Product = require("../models/product");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fileHelper = require('../utils/file')

const ITEMS_PER_PAGE = 2;

// Display All Products
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find({userId: req.session.user._id})
    .countDocuments()
    .then(num => {
      totalItems = num;
      return Product.find({ userId: req.session.user._id })
        .skip((page-1)*ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
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

// Add a Product - GET
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    hasErrors: false,
    errorMessage: null,
    validationErrors: [],
  });
};

// Add a Product - POST
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      errorMessage: "Attached file is not an image",
      product: {
        title: title,
        price: price,
        description: description,
      },
      isAuthenticated: req.session.isLoggedIn,
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title: title,
        price: price,
        description: description,
      },
      isAuthenticated: req.session.isLoggedIn,
      validationErrors: errors.array(),
    });
  }

  const product = new Product({
    //_id: new mongoose.Types.ObjectId('61a4a31ea84d0e002f59a950'),
    title: title,
    imageUrl: image.path,
    price: price,
    description: description,
    userId: req.session.user,
  });
  product
    .save()
    .then((result) => {
      console.log("PRODUCT ADDED SUCCESSFULLY");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Edit Product Page
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  } else {
    // Retrive the product
    const prodId = req.params.productId;
    Product.findById(prodId)
      .then((product) => {
        if (!product) {
          res.redirect("/"); // Redirect if no product found
        } else {
          res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            product: product,
            isAuthenticated: req.session.isLoggedIn,
            hasErrors: false,
            errorMessage: null,
            validationErrors: [],
          });
        }
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
};

// Edit a Product - POST
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  // if(!image) {
  //   return res.status(422).render("admin/edit-product", {
  //     pageTitle: "Edit Product",
  //     path: "/admin/edit-product",
  //     editing: true,
  //     hasErrors: true,
  //     errorMessage: 'Attached file is not an image',
  //     product: {
  //       title: updatedTitle,
  //       price: updatedPrice,
  //       description: updatedDescription,
  //       _id: prodId,
  //     },
  //     isAuthenticated: req.session.isLoggedIn,
  //     validationErrors: [],
  //   });
  // }
  const errors = validationResult(req);


  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasErrors: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        _id: prodId,
      },
      isAuthenticated: req.session.isLoggedIn,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect("/");
      }
      if(image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path;
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;

      return product.save().then((result) => {
        console.log("PRODUCT UPDATED SUCCESSFULLY!!");
        res.redirect("/admin/products");
      });
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Delete a Product - POST
exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(prod => {
      if(!prod) {
        return next (new Error('Product not found'))
      }

      fileHelper.deleteFile(prod.imageUrl)

      return Product.deleteOne({ _id: prodId, userId: req.session.user._id })

    })
    .then((result) => {
      return User.updateMany(
        {},
        {
          $pull: {
            "cart.items": { productId: prodId },
          },
        }
      );
    })
    .then((result) => {
      console.log("Item Deleted");
    })
    .then(() => {
      console.log("Product Deleted");
      //res.redirect("/admin/products");

      res.status(200).json({ message: "Success"});
    })
    .catch((err) => {
      res.status(500).json({ message: 'Product deletion failed'})
    });
};
