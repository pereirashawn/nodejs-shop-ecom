const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})


module.exports = mongoose.model('Product',productSchema);

// const mongodb = require("mongodb");
// const database = require("../utils/database");

// class Product {
//   constructor(title, imageUrl, price, description, id, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id) : null,
//     this.userId = userId
//   }

//   save() {
//     const db = database.getDb();
//     let dbOp;

//     if (this._id) {
//       // Update the product
//       dbOp = db
//         .collection("products")
//         .updateOne({ _id: this._id }, { $set: this });
//     } else {
//       // Insert the product
//       dbOp = db.collection("products").insertOne(this);
//     }
//     return dbOp
//       .then((result) => {
//         console.log(result);
//       })
//       .catch((err) => {
//         console.timeLog(err);
//       });
//   }

//   static fetchAll() {
//     const db = database.getDb();
//     return db
//       .collection("products")
//       .find()
//       .toArray()
//       .then((products) => {
//         return products;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   static findById(prodId) {
//     const db = database.getDb();
//     return db
//       .collection("products")
//       .findOne({ _id: new mongodb.ObjectId(prodId) })
//       .then((product) => {
//         return product;
//       })
//       .catch((err) => {
//         console.log(product);
//       });
//   }

//   static deleteById(prodId, userId) {
//     const db = database.getDb();
//     return db
//       .collection('products')
//       .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//       .then((result) => {
//         return db.collection('users').updateOne(
//           { _id: new mongodb.ObjectId(userId) },
//           {
//             $pull: {
//               'cart.items': { productId: new mongodb.ObjectId(prodId) },
//             },
//           }
//         );
//       })
//       .then((result) => {
//         console.log('Cart Item Deleted');
//       })
//       .then(() => {
//         console.log('Product Deleted');
//       });
//   }
// }

// module.exports = Product;

//   static deleteById(prodId) {
//     const db = database.getDb();
//     return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)})
//       .then(result => {
//         console.log('Product Deleted')
//       })
//       .catch(err => {
//         console.log(err)
//       })
//   }
// }



// const {
//   Sequelize,
//   DataTypes
//   } = require('sequelize');

// const sequelize = require('../utils/database');

// const Product = sequelize.define('product',{
//   id : {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     allowNull: false,
//     primaryKey: true
//   },
//   title: {
//     type : DataTypes.STRING,
//     allowNull: false
//   },
//   price : {
//     type: DataTypes.DOUBLE,
//     allowNull: false
//   },
//   imageUrl : {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   description: {
//     type: DataTypes.STRING,
//     allowNull: false
//   }
// });

// module.exports = Product;
