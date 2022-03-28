const mongoose = require("mongoose");
const Product = require("./product");

const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    // Product already exists in cart
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    // Add product to cart
    updatedCartItems.push({
      productId: product._id,
      quantity: 1,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.getCartProducts = function (prod) {
  const products = prod
    .filter((i) => {
      return i.productId !== null;
    })
    .map((el) => {
      if (el.productId !== null) {
        //console.log("el.productId : ", el.productId);
        Product.findById(el.productId._id)
          .then((result) => {
            if (!result) {
              this.delete(el);
            }
          })
          .catch((err) => {
            console.log(err);
          });
        //console.log("Returned from el : ", el);
        return el;
      }
      // } else {
      //   this.delete(el);
      //   return null;
      // }
    });
  //console.log("func: ", products);
  return products;
};

userSchema.methods.removeFromCart = function (prodId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== prodId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  this.save();
};

module.exports = mongoose.model("User", userSchema);

// const mongodb = require("mongodb");
// const database = require("../utils/database");
// const Product = require("./product");

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items[{prodId,quantity}]}
//     this._id = id;
//   }

//   save() {
//     const db = database.getDb();
//     return db.collection("users").insertOne(this);
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((cp) => {
//       return cp.productId.toString() == product._id.toString();
//     });

//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       // Product already exists in cart
//       newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//       updatedCartItems[cartProductIndex].quantity = newQuantity;
//     } else {
//       // Add product to cart
//       updatedCartItems.push({
//         productId: new mongodb.ObjectId(product._id),
//         quantity: 1,
//       });
//     }

//     const updatedCart = {
//       items: updatedCartItems,
//     };

//     const db = database.getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       );
//   }

//   getCart() {
//     const db = database.getDb();
//     const productIds = [];
//     const quantities = {};
//     const mismatch = [];

//     this.cart.items.forEach((ele) => {
//       let prodId = ele.productId;
//       productIds.push(prodId);
//       quantities[prodId] = ele.quantity;
//     });

//         return db
//         .collection("products")
//         .find({ _id: { $in: productIds } })
//         .toArray()
//         .then((products) => {
//             return products.map((p) => {
//                 return { ...p, quantity: quantities[p._id] };
//                 });
//       });
//   }

//   deleteItemFromCart(productId) {
//     const updatedCartItems = this.cart.items.filter((el) => {
//       return el.productId.toString() !== productId.toString();
//     });

//     console.log(updatedCartItems);

//     const db = database.getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = database.getDb();
//     return this.getCart()
//       .then((products) => {
//         const orders = {
//           user: {
//             _id: new mongodb.ObjectId(this._id),
//             name: this.name,
//           },
//           items: products,
//         };
//         return db.collection("orders").insertOne(orders);
//       })
//       .then((result) => {
//         this.cart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne({ _id: this._id }, { $set: { cart: { items: [] } } });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   getOrders() {
//     const db = database.getDb();
//     return db.collection("orders").find().toArray();
//   }

//   static findById(userId) {
//     const db = database.getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new mongodb.ObjectId(userId) });
//   }
// }

// module.exports = User;
