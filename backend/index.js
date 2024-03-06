const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://admin:12345@rebecca.gwrn5bi.mongodb.net/?retryWrites=true&w=majority&appName=Rebecca",
    {}
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Could not connect to MongoDB Atlas", err));

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

// Path: backend/models/Post.js
