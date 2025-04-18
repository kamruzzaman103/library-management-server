const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  image: String,
  name: String,
  author: String,
  category: String,
  quantity: Number,
  rating: Number,
  shortDescription: String,
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
