const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = "cms30mhr01qlk9b10me0cms30mhr01qlk9b10meg";

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

app.get("/search", async (req, res) => {
  const query = req.query.q;
  const url = `https://finnhub.io/api/v1/search?q=${query}&token=cms30mhr01qlk9b10me0cms30mhr01qlk9b10meg`;

  try {
    const response = await axios.get(url);
    const filteredData = response.data.result.filter(
      (item) => item.type === "Common Stock" && !item.symbol.includes(".")
    );
    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching stock data", error);
    res.status(500).send("Error fetching stock data");
  }
});

app.get("/api/stock/profile", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send("Error fetching stock profile");
  }
});

app.get("/api/stock/quote", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send("Error fetching stock quote");
  }
});

app.get("/api/stock/companypeers", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).send("Error fetching stock company peers");
  }
});

app.get("/api/stock/companynews", async (req, res) => {
  const { symbol } = req.query;
  // Calculate dates for the from and to query parameters
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);

  // Format dates to YYYY-MM-DD
  const to = toDate.toISOString().split("T")[0];
  const from = fromDate.toISOString().split("T")[0];
  console.log(`From date: ${from}, To date: ${to}`);

  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=cms30mhr01qlk9b10me0cms30mhr01qlk9b10meg`
    );

    // Filter news items that have all required fields
    const filteredNews = response.data
      .filter(
        (newsItem) =>
          newsItem.image &&
          newsItem.headline &&
          newsItem.url &&
          newsItem.datetime &&
          newsItem.summary &&
          newsItem.source
      )
      .slice(0, 20); // Return only the first 20 items

    res.json(filteredNews);
  } catch (error) {
    console.error("Error fetching stock news:", error.message);
    res.status(500).send("Error fetching stock news");
  }
});

app.get("/api/stock/insidersentiment", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${symbol}&from=2022-01-01&token=${FINNHUB_API_KEY}`
    );
    const data = response.data;

    // Initialize aggregation variables
    let total = 0;
    let positive = 0;
    let negative = 0;
    let changeTotal = 0;
    let positiveChange = 0;
    let negativeChange = 0;

    // Assuming data.data is the array containing the sentiment objects
    data.data.forEach(item => {
      const mspr = item.mspr;
      const change = item.change;

      // Aggregate total mspr
      total += mspr;
      // Aggregate positive and negative mspr
      if (mspr > 0) positive += mspr;
      if (mspr < 0) negative += mspr;

      // Aggregate total change
      changeTotal += change;
      // Aggregate positive and negative change
      if (change > 0) positiveChange += change;
      if (change < 0) negativeChange += change;
    });

    // Round off all values to two decimals
    const result = {
      total: parseFloat(total.toFixed(2)),
      positive: parseFloat(positive.toFixed(2)),
      negative: parseFloat(negative.toFixed(2)),
      changeTotal: parseFloat(changeTotal.toFixed(2)),
      positiveChange: parseFloat(positiveChange.toFixed(2)),
      negativeChange: parseFloat(negativeChange.toFixed(2)),
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching stock insider sentiment:", error.message);
    res.status(500).send("Error fetching stock insider sentiment");
  }
});

app.get("/api/stock/historical", async (req, res) => {
  const { symbol, from, to } = req.query;
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/${from}/${to}?adjusted=true&sort=asc&apiKey=BKNanm3UkObHTvdgfAZNXgV7NrFu8aGr`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching historical stock data", error);
    res.status(500).send("Error fetching historical stock data");
  }
});


app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

// Path: backend/models/Post.js
