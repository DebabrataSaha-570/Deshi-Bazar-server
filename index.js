require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("deshiBazar");
    const productsCollection = db.collection("products");

    app.post("/api/v1/product", async (req, res) => {
      const product = req.body;
      console.log("product", product);
      const result = await productsCollection.insertOne(product);
      res.json(result);
    });

    app.get("/api/v1/products", async (req, res) => {
      try {
        let query = {};

        if (req.query.categories) {
          query.categories = req.query.categories;
        } else if (req.query.flash_sale) {
          query.flash_sale = req.query.flash_sale;
        }
        const products = productsCollection.find(query);
        const result = await products.toArray();
        res.json(result);
      } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/v1/product/:productId", async (req, res) => {
      const id = req.params.productId;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.findOne(query);
        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ error: "Product Not Found" });
        }
      } catch (error) {
        console.error("Error ", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Deshi Bazar Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
