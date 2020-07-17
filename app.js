// Packages
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Routes
const loginRoute = require("./api/routes/auth/login");
const signUpRoute = require("./api/routes/auth/signup");
const userRoute = require("./api/routes/user/user");
const resourceRoute = require("./api/routes/resource/resource");
const collectionRoute = require("./api/routes/collection/collection");

// Mongodb connection string
try {
  const mongodb_connection_string = `mongodb+srv://${process.env.MLAB_U}:${process.env.MLAB_PW}@cluster0-hckl1.gcp.mongodb.net/test?retryWrites=true&w=majority`;

  mongoose
    .connect(mongodb_connection_string, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    })
    .then(res => {
      console.log("Connected to database");
    });

  //! If mongodb connection fails
  mongoose.connection.on("error", err => {
    console.log(`Mongoose connection error: ${err}`);
  });

  mongoose.set("useCreateIndex", true);
} catch (error) {
    console.error(error);
}

app.use(morgan("dev"));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(
  bodyParser.json({
    limit: "10mb"
  })
);

// Handling CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Methods",
      "PUT",
      "POST",
      "PATCH",
      "DELETE",
      "GET"
    );
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/login", loginRoute);
app.use("/signup", signUpRoute);
app.use("/user", userRoute);
app.use("/resource", resourceRoute);
app.use("/collection", collectionRoute);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;
