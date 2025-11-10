const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  fs.readdir("./files", (err, files) => {
    if (err) {
      if (!fs.existsSync("./files")) fs.mkdirSync("./files");
      files = [];
    }
    res.render("index", { files });
  });
});

// Create file
app.post("/upload", (req, res) => {
  const safeTitle = req.body.title.trim().replace(/\s+/g, "_");
  fs.writeFile(`./files/${safeTitle}.txt`, req.body.desc, (err) => {
    if (err) return res.status(500).send("Error creating file");
    res.redirect("/");
  });
});

// Read file
app.get("/files/:title", (req, res) => {
  const title = req.params.title;
  fs.readFile(`./files/${title}`, "utf-8", (err, data) => {
    if (err) return res.status(404).send("File not found");
    res.render("show", { filename: title, filedata: data });
  });
});

// Edit file
app.get("/edit/:name", (req, res) => {
  const filePath = path.join(__dirname, "files", req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
  const filedata = fs.readFileSync(filePath, "utf-8");
  res.render("edit", { filename: req.params.name, description: filedata });
});

// Handle edit (rename + update content)
app.post("/edit", (req, res) => {
  const { previousName, newName, description } = req.body;
  const oldPath = path.join(__dirname, "files", previousName);
  const newPath = path.join(
    __dirname,
    "files",
    newName.split(" ").join("_") + ".txt"
  );

  try {
    // Rename if name changed
    if (previousName !== newName) fs.renameSync(oldPath, newPath);
    // Update content
    fs.writeFileSync(newPath, description, "utf-8");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating file");
  }
});

// Delete file
app.get("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  fs.unlink(`./files/${filename}`, (err) => {
    if (err) return res.status(500).send("Error deleting file");
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
