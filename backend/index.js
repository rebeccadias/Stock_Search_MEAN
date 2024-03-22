const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = "cms30mhr01qlk9b10me0cms30mhr01qlk9b10meg";
const polygon_API_KEY = "BKNanm3UkObHTvdgfAZNXgV7NrFu8aGr";

app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://admin:12345@rebecca.gwrn5bi.mongodb.net/?retryWrites=true&w=majority&appName=Rebecca",
    {}
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Could not connect to MongoDB Atlas", err));

// mongoose
//   .connect(
//     "mongodb+srv://bhavenvi:12345@cluster0.dzwa3me.mongodb.net/?retryWrites=true&w=majority",
//     {}
//   )
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch((err) => console.error("Could not connect to MongoDB Atlas", err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  balance: { type: Number, required: true },
  stocks: [
    {
      symbol: String,
      quantity: Number,
      action: String, // "BUY" or "SELL"
      price: Number,
      totalCost: Number,
      date: { type: Date, default: Date.now },
      tickername: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);

const watchlistSchema = new mongoose.Schema({
  ticker: String,
  name: String,
  price: Number,
  change: Number,
  changePercent: Number,
  dateAdded: { type: Date, default: Date.now },
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

module.exports = Watchlist;

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
  //The code calculates two dates: fromDate and toDate. toDate is the current date, and fromDate is set to 6 months before the current date
  const to = toDate.toISOString().split("T")[0];
  const from = fromDate.toISOString().split("T")[0];

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
    data.data.forEach((item) => {
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

  // const url =
  //   "https://api.polygon.io/v2/aggs/ticker/TSLA/range/1/hour/2024-03-14/2024-03-15?adjusted=true&sort=asc&apiKey=BKNanm3UkObHTvdgfAZNXgV7NrFu8aGr";

  try {
    const response = await axios.get(url);
    // console.log("response", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching historical stock data", error);
    res.status(500).send("Error fetching historical stock data");
  }
});

app.get("/api/stock/historical2years", async (req, res) => {
  const { symbol, from, to } = req.query;

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${polygon_API_KEY}`;

  try {
    const response = await axios.get(url);
    console.log("response", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching historical stock data", error);
    res.status(500).send("Error fetching historical stock data");
  }
});

app.post("/api/user/init", async (req, res) => {
  const { name } = req.body;

  try {
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({
        name,
        balance: 25000, // Initialize with $25,000
        stocks: [],
      });
      await user.save();
    }
    res.json(user);
  } catch (error) {
    console.error("Error initializing user", error);
    res.status(500).send("Error initializing user");
  }
});

app.post("/api/user/buy", async (req, res) => {
  const { name, symbol, quantity, price } = req.body;

  try {
    const totalCost = quantity * price;
    const user = await User.findOne({ name });

    if (!user || user.balance < totalCost) {
      return res.status(400).send("Insufficient balance or user not found");
    }

    // Check if the stock already exists in the user's portfolio
    let stock = user.stocks.find((stock) => stock.symbol === symbol);

    if (stock) {
      // Stock exists, update quantity and total cost
      stock.quantity += quantity;
      stock.totalCost += totalCost;
      stock.price = stock.totalCost / stock.quantity; // Update average cost per share
    } else {
      // Stock does not exist, add a new entry to the portfolio
      user.stocks.push({
        symbol,
        quantity,
        action: "BUY",
        price, // This represents the latest price, but total cost will represent the average
        totalCost, // New field to keep track of total cost for average calculation
        tickername: symbol, // Assuming tickername is the same as symbol
      });
    }

    // Update user balance
    user.balance -= totalCost;

    await user.save();
    res.json({ message: "Stock purchased", user });
  } catch (error) {
    console.error("Error buying stock", error);
    res.status(500).send("Error buying stock");
  }
});

app.post("/api/user/sell", async (req, res) => {
  const { name, symbol, quantity, price } = req.body;

  try {
    const user = await User.findOne({ name });
    const totalSaleAmount = quantity * price;

    // Check if user owns the stock and has enough quantity to sell
    // This is a simplified check; you'll likely need more complex logic
    // to handle partial sells or multiple purchases of the same stock
    const stockIndex = user.stocks.findIndex(
      (stock) =>
        stock.symbol === symbol &&
        stock.quantity >= quantity &&
        stock.action === "BUY"
    );
    if (stockIndex === -1) {
      return res.status(400).send("Stock not owned or insufficient quantity");
    }

    user.balance += totalSaleAmount;
    // Adjust the quantity or remove the stock from the profile if all shares are sold
    // This is a simplified approach
    user.stocks[stockIndex].quantity -= quantity;
    if (user.stocks[stockIndex].quantity === 0)
      user.stocks.splice(stockIndex, 1);

    await user.save();

    res.json({ message: "Stock sold", user });
  } catch (error) {
    console.error("Error selling stock", error);
    res.status(500).send("Error selling stock");
  }
});

app.get("/api/user/wallet", async (req, res) => {
  const { name } = req.query;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json({ name: user.name, balance: user.balance });
  } catch (error) {
    console.error("Error retrieving user balance", error);
    res.status(500).send("Error retrieving user balance");
  }
});

app.post("/api/user/watchlist", async (req, res) => {
  console.log(req.body);

  const { wticker, wname, wprice, wchange, wchangePercent } = req.body;

  try {
    // Check if the stock is already in the watchlist
    const stockExists = await Watchlist.findOne({ ticker: wticker });
    if (stockExists) {
      return res.status(400).send("Stock already in watchlist");
    }

    // Create a new stock document in the watchlist
    const newStock = new Watchlist({
      ticker: wticker,
      name: wname,
      price: wprice,
      change: wchange,
      changePercent: wchangePercent,
      dateAdded: new Date(), // This is optional since default is Date.now()
    });

    await newStock.save(); // Save the new stock document

    res.json({ message: "Stock added to watchlist", newStock });
  } catch (error) {
    console.error("Error adding stock to watchlist", error);
    res.status(500).send("Error adding stock to watchlist");
  }
});

app.get("/api/all/watchlist", async (req, res) => {
  try {
    const watchlist = await Watchlist.find({}); // Fetch all documents
    res.json(watchlist);
  } catch (error) {
    console.error("Error retrieving watchlist", error);
    res.status(500).send("Error retrieving watchlist");
  }
});

app.delete("/api/watchlist/delete", async (req, res) => {
  const { ticker } = req.query;
  console.log("ticker", ticker);

  try {
    const result = await Watchlist.deleteOne({ ticker: ticker });

    if (result.deletedCount === 0) {
      return res.status(404).send("Stock not found in watchlist");
    }

    res.send({ message: "Stock removed from watchlist" });
  } catch (error) {
    console.error("Error removing stock from watchlist", error);
    res.status(500).send("Error removing stock from watchlist");
  }
});

app.get("/api/user/portfolio", async (req, res) => {
  const { name } = req.query;
  try {
    const user = await User.findOne({ name }).populate("stocks");
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user.stocks);
  } catch (error) {
    console.error("Error retrieving portfolio", error);
    res.status(500).send("Error retrieving portfolio");
  }
});

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

// Path: backend/models/Post.js
