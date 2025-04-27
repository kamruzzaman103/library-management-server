const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Global collections
let bookCollection;
let borrowedCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db("libraryDB");
    bookCollection = db.collection("books");
    borrowedCollection = db.collection("borrowedBooks");

    console.log("✅ MongoDB connected and collections initialized");

    // Add a new book
    app.post("/api/books", async (req, res) => {
      const book = req.body;
      book.rating = parseFloat(book.rating);
      const result = await bookCollection.insertOne(book);
      res.send(result);
    });

    // Update a book
    app.put("/api/books/:id", async (req, res) => {
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
    app.get("/api/books/:id", async (req, res) => {
      const book = await bookCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(book);
    });

  

    // Borrow a book
    app.post("/api/borrow", async (req, res) => {
      const { bookId, userName, userEmail, returnDate } = req.body;

      try {
        const book = await bookCollection.findOne({
          _id: new ObjectId(bookId),
        });

        if (!book) {
          return res
            .status(404)
            .send({ success: false, message: "Book not found" });
        }

        if (book.quantity === 0) {
          return res
            .status(400)
            .send({ success: false, message: "Book not available" });
        }

        // Check if the user already borrowed this book
        const alreadyBorrowed = await borrowedCollection.findOne({
          bookId,
          userEmail,
        });

        if (alreadyBorrowed) {
          return res
            .status(400)
            .send({
              success: false,
              message: "You already borrowed this book.",
            });
        }

        // Decrease book quantity
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
    app.get("/api/borrowed", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ error: "Email is required." });

      try {
        const borrowedBooks = await borrowedCollection
          .find({ userEmail: email })
          .sort({ borrowedAt: -1 })
          .toArray();

        res.send(borrowedBooks);
      } catch (error) {
        console.error("❌ Failed to fetch borrowed books:", error);
        res.status(500).send({ error: "Server error." });
      }
    });

    // Return a book (delete from borrowed + increment quantity)
    app.delete("/api/borrowed/:id", async (req, res) => {
      const borrowedId = req.params.id;

      try {
        const borrowed = await borrowedCollection.findOne({
          _id: new ObjectId(borrowedId),
        });

        if (!borrowed) {
          return res.status(404).send({ message: "Borrow record not found" });
        }

        // Increase quantity by 1
        await bookCollection.updateOne(
          { _id: new ObjectId(borrowed.bookId) },
          { $inc: { quantity: 1 } }
        );

        // Remove from borrowed collection
        await borrowedCollection.deleteOne({ _id: new ObjectId(borrowedId) });

        res.send({ message: "Book returned successfully" });
      } catch (error) {
        console.error("❌ Failed to return book:", error);
        res.status(500).send({ error: "Return failed" });
      }
    });

    // category
    app.get("/api/books", async (req, res) => {
      const category = req.query.category;

      let query = {};
      if (category) {
        query = { category: { $regex: new RegExp(category, "i") } }; // Case-insensitive
      }

      const books = await bookCollection.find(query).toArray();
      res.send(books);
    });

    //  Get all books
    app.get("/api/books", async (req, res) => {
      const books = await bookCollection.find().toArray();
      res.send(books);
    });

  } finally {
    // Server keeps running
  }
}

run().catch(console.error);

// Root route
app.get("/", (req, res) => {
  res.send("📚 Library API is running with Cloudinary support!");
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
