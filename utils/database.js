const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(process.env.DB_URL)
    .then((client) => {
      _db = client.db();
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No Database Found";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
