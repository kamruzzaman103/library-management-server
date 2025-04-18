const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// GET all books
router.get("/", async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

// GET book by id
router.get("/:id", async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.json(book);
});

// POST create a new book
router.post("/", async (req, res) => {
  const newBook = new Book(req.body);
  await newBook.save();
  res.status(201).json(newBook);
});

// PUT update a book
router.put("/:id", async (req, res) => {
  const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedBook);
});

// DELETE book
router.delete("/:id", async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: "Book deleted" });
});

module.exports = router;
