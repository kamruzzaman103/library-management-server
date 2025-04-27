const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId} = require("mongodb");
require("dotenv").config();

const bookRoutes = require("./routes/bookRoutes");
const borrowedRoutes = require("./routes/borrowedRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Collections
async function run() {
  try {
    await client.connect();
    const db = client.db("libraryDB");
    const bookCollection = db.collection("books");
    const borrowedCollection = db.collection("borrowedBooks");

    // Set collections in routers
    bookRoutes.setCollections({ bookCollection });
    borrowedRoutes.setCollections({ bookCollection, borrowedCollection });

    // Use routes
    app.use("/api/books", bookRoutes.router);
    app.use("/", borrowedRoutes.router);

    console.log("✅ MongoDB connected and routes initialized");

  } catch (error) {
    console.error("Failed to connect MongoDB", error);
  }
}

run().catch(console.error);


app.get("/", (req, res) => {
  res.send("📚 Library API is running!");
});


app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
