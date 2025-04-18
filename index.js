// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// require("dotenv").config();

// const bookRoutes = require("./routes/bookRoutes");

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // routes
// app.use("/api/books", bookRoutes);

// // DB connect
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB connected");
//     app.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//   })
//   .catch((err) => console.log(err));

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Setup
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const bookCollection = client.db("libraryDB").collection("books");

    // POST - Add a book
    app.post("/api/books", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    });

    // GET - All books
    app.get("/api/books", async (req, res) => {
      const books = await bookCollection.find().toArray();
      res.send(books);
    });

    // GET - Single book by ID
    app.get("/api/books/:id", async (req, res) => {
      const id = req.params.id;
      const book = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(book);
    });
  } finally {
    // Optional: Keep the DB connection open
  }
}

run().catch(console.error);

// Root
app.get("/", (req, res) => {
  res.send("📚 Library API is running");
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
