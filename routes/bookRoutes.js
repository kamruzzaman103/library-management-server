const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

let bookCollection;

function setCollections(collections) {
  bookCollection = collections.bookCollection;
}

// Add a new book
router.post("/", async (req, res) => {
  const book = req.body;
  book.rating = parseFloat(book.rating);
  const result = await bookCollection.insertOne(book);
  res.send(result);
});

// Update a book
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, category, rating, description, image } = req.body;

  const updatedData = {
    title,
    author,
    category,
    rating: parseFloat(rating),
    description,
    image,
  };

  try {
    const result = await bookCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Book not found" });
    }

    res.send({ message: "Book updated successfully", updatedId: id });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).send({ message: "Failed to update book" });
  }
});

// Get single book
router.get("/:id", async (req, res) => {
  const book = await bookCollection.findOne({
    _id: new ObjectId(req.params.id),
  });
  res.send(book);
});

// Get all books (optional category filter)
router.get("/", async (req, res) => {
  const category = req.query.category;
  let query = {};
  if (category) {
    query = { category: { $regex: new RegExp(category, "i") } };
  }
  const books = await bookCollection.find(query).toArray();
  res.send(books);
});

module.exports = { router, setCollections };
