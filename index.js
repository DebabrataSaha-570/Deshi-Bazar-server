require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    const userCollection = db.collection("users");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password, role } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        role,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    app.post("/api/v1/product", async (req, res) => {
      const product = req.body;
      console.log("product", product);
      const result = await productsCollection.insertOne(product);
      console.log(result);
      res.json(result);
    });

    app.get("/api/v1/products", async (req, res) => {
      console.log("query", req.query);
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

    app.get("/api/v1/users", async (req, res) => {
      try {
        const users = userCollection.find({});
        const result = await users.toArray();
        if (result) {
          res.json(result);
        }
      } catch (err) {
        console.log(err);
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

    app.put("/api/v1/user/:userId", async (req, res) => {
      const id = req.params.userId;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    app.delete("/api/v1/user/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      console.log(result);
      res.json(result);
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
