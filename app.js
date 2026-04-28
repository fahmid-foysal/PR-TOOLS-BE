require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const userRouter = require("./api/users/users.router");
const configRouter = require("./api/configuration/configuration.router");
const productsRouter = require("./api/products/products.router");
const orderRouter = require("./api/order/order.router");

// Allow all CORS origins
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routers
app.use("/users", userRouter);
app.use("/config", configRouter);
app.use("/products", productsRouter);
app.use("/order", orderRouter);

// Simple root route for cPanel check
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("<h1>Server is running!</h1>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});