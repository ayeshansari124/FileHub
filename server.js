const express = require("express");
const expressLayout = require("express-ejs-layouts");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set("view engine", "ejs");
app.use(expressLayout);
app.set("layout", "layouts/main");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Ensure files folder exists
const filesDir = path.join(__dirname, "files");
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir);

// Home route
app.get("/", (req, res) => {
  fs.readdir(filesDir, (err, files) => {
    if (err) files = [];
    res.render("index", { title: "FileHub", files });
  });
});

// Create file
app.post("/upload", (req, res) => {
  const safeTitle = req.body.title.trim().replace(/\s+/g, "_");
  const filepath = path.join(filesDir, `${safeTitle}.txt`);
  fs.writeFile(filepath, req.body.desc, (err) => {
    if (err) return res.status(500).send("Error creating file");
    res.redirect("/");
  });
});

// Read file
app.get("/files/:title", (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const filepath = path.join(filesDir, title);
  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) return res.status(404).send("File not found");
    res.render("show", { title: "ViewHub", filename: title, filedata: data });
  });
});

// Edit file form
app.get("/edit/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const filepath = path.join(filesDir, name);
  if (!fs.existsSync(filepath)) return res.status(404).send("File not found");
  const filedata = fs.readFileSync(filepath, "utf-8");
  res.render("edit", { title: "EditHub", filename: name, description: filedata });
});

// Save edits
app.post("/edit", (req, res) => {
  let { previousName, newName, description } = req.body;

  newName = newName.trim().replace(/\s+/g, "_");
  if (!newName.toLowerCase().endsWith(".txt")) newName += ".txt";

  const oldPath = path.join(filesDir, previousName);
  const newPath = path.join(filesDir, newName);

  try {
    if (previousName !== newName) fs.renameSync(oldPath, newPath);
    fs.writeFileSync(newPath, description, "utf-8");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating file");
  }
});

// Delete file
app.get("/delete/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = path.join(filesDir, filename);
  if (!fs.existsSync(filepath)) return res.status(404).send("File not found");
  fs.unlink(filepath, (err) => {
    if (err) return res.status(500).send("Error deleting file");
    res.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
