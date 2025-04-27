const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

let bookCollection;
let borrowedCollection;

function setCollections(collections) {
  bookCollection = collections.bookCollection;
  borrowedCollection = collections.borrowedCollection;
}

// Borrow a book
router.post("/", async (req, res) => {
  const { bookId, userName, userEmail, returnDate } = req.body;

  try {
    const book = await bookCollection.findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).send({ success: false, message: "Book not found" });
    }

    if (book.quantity === 0) {
      return res.status(400).send({ success: false, message: "Book not available" });
    }

    const alreadyBorrowed = await borrowedCollection.findOne({
      bookId,
      userEmail,
    });

    if (alreadyBorrowed) {
      return res.status(400).send({ success: false, message: "You already borrowed this book." });
    }

    await bookCollection.updateOne(
      { _id: new ObjectId(bookId), quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } }
    );

    const borrowData = {
      bookId,
      title: book.title,
      image: book.image,
      category: book.category,
      userName,
      userEmail,
      returnDate,
      borrowedAt: new Date(),
    };

    const result = await borrowedCollection.insertOne(borrowData);

    res.status(200).send({
      success: true,
      message: "Borrowed successfully",
      id: result.insertedId,
    });
  } catch (err) {
    console.error("Error borrowing book:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

// Get borrowed books by user email
router.get("/", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ error: "Email is required." });

  try {
    const borrowedBooks = await borrowedCollection
      .find({ userEmail: email })
      .sort({ borrowedAt: -1 })
      .toArray();

    res.send(borrowedBooks);
  } catch (error) {
    console.error("Failed to fetch borrowed books:", error);
    res.status(500).send({ error: "Server error." });
  }
});

// Return a book
router.delete("/:id", async (req, res) => {
  const borrowedId = req.params.id;

  try {
    const borrowed = await borrowedCollection.findOne({
      _id: new ObjectId(borrowedId),
    });

    if (!borrowed) {
      return res.status(404).send({ message: "Borrow record not found" });
    }

    await bookCollection.updateOne(
      { _id: new ObjectId(borrowed.bookId) },
      { $inc: { quantity: 1 } }
    );

    await borrowedCollection.deleteOne({ _id: new ObjectId(borrowedId) });

    res.send({ message: "Book returned successfully" });
  } catch (error) {
    console.error("Failed to return book:", error);
    res.status(500).send({ error: "Return failed" });
  }
});

module.exports = { router, setCollections };
