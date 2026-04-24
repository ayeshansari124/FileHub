require("dotenv").config();

const express = require("express");
const expressLayout = require("express-ejs-layouts");
const path = require("path");

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");
const File = require("./models/File");

const app = express();
connectDB();

// ================= VIEW =================
app.set("view engine", "ejs");
app.use(expressLayout);
app.set("layout", "layouts/main");

// ================= MIDDLEWARE =================
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
  res.locals.title = "FileHub";
  next();
});

// ================= SESSION =================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  }),
);

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  next();
});
// ================= AUTH MIDDLEWARE =================
const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/");
  next();
};

// ================= AUTH =================

// Signup

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.send("User already exists");

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
    });

    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Signup error");
  }
});

// Login

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Wrong password");

    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Login error");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ================= FILES =================

// Home
app.get("/", async (req, res) => {
  if (!req.session.userId) {
    return res.render("index", { files: [] });
  }

  const files = await File.find({ userId: req.session.userId });
  res.render("index", { files });
});
// Create
app.post("/upload", isAuth, async (req, res) => {
  try {
    await File.create({
      title: req.body.title,
      content: req.body.desc,
      userId: req.session.userId,
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Create error");
  }
});

// Read (SECURED)
app.get("/files/:id", isAuth, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!file) return res.send("File not found");

    res.render("show", {
      filename: file.title,
      filedata: file.content,
      id: file._id,
    });
  } catch (err) {
    console.error(err);
    res.send("Error loading file");
  }
});

// Edit page
app.get("/edit/:id", isAuth, async (req, res) => {
  const file = await File.findOne({
    _id: req.params.id,
    userId: req.session.userId,
  });

  if (!file) return res.send("File not found");

  res.render("edit", {
    filename: file.title,
    description: file.content,
    id: file._id,
  });
});

// Save edit
app.post("/edit/:id", isAuth, async (req, res) => {
  try {
    await File.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.session.userId,
      },
      {
        title: req.body.newName,
        content: req.body.description,
      },
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Update error");
  }
});

// Delete
app.get("/delete/:id", isAuth, async (req, res) => {
  try {
    await File.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Delete error");
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
