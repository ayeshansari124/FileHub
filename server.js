const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 🏠 Home route
app.get('/', (req, res) => {
  fs.readdir('./files', (err, files) => {
    if (err) {
      if (!fs.existsSync('./files')) fs.mkdirSync('./files');
      files = [];
    }
    res.render('index', { files });
  });
});

// ➕ Create file
app.post('/upload', (req, res) => {
  const safeTitle = req.body.title.trim().replace(/\s+/g, '_');
  fs.writeFile(`./files/${safeTitle}.txt`, req.body.desc, (err) => {
    if (err) return res.status(500).send('Error creating file');
    console.log('File created successfully');
    res.redirect('/');
  });
});

// 📖 Read file
app.get('/files/:title', (req, res) => {
  const title = req.params.title;
  fs.readFile(`./files/${title}`, 'utf-8', (err, data) => {
    if (err) return res.status(404).send('File not found');
    res.render('show', { filename: title, filedata: data });
  });
});

// // ✏️ Rename file page
// app.get('/edit/:filename', (req, res) => {
//   res.render('edit', { filename: req.params.filename });
// });

// // ✏️ Rename file logic
// app.post('/edit', (req, res) => {
//   const { previousName, newName } = req.body;
//   fs.rename(`./files/${previousName}`, `./files/${newName}`, (err) => {
//     if (err) return res.status(500).send('Error renaming file');
//     console.log('File renamed successfully');
//     res.redirect('/');
//   });
// });

// // 🧾 Edit file content page
// app.get('/edit-content/:filename', (req, res) => {
//   const filename = req.params.filename;
//   fs.readFile(`./files/${filename}`, 'utf-8', (err, data) => {
//     if (err) return res.status(404).send('File not found');
//     res.render('editContent', { filename, filedata: data });
//   });
// });

// // 🧾 Save updated content
// app.post('/edit-content', (req, res) => {
//   const { filename, newContent } = req.body;
//   fs.writeFile(`./files/${filename}`, newContent, (err) => {
//     if (err) return res.status(500).send('Error updating file');
//     console.log('File content updated successfully');
//     res.redirect(`/files/${filename}`);
//   });
// });

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
  const newPath = path.join(__dirname, "files", newName);

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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.get("/edit/:name", async (req, res) => {
  const file = await db.collection("files").findOne({ name: req.params.name });
  if (!file) return res.status(404).send("File not found");

  res.render("edit", { filename: file.name, description: file.desc });
});

app.post("/edit", async (req, res) => {
  const { previousName, newName, description } = req.body;
  await db.collection("files").updateOne(
    { name: previousName },
    { $set: { name: newName, desc: description } }
  );
  res.redirect("/");
});


// ❌ Delete file
app.get('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  fs.unlink(`./files/${filename}`, (err) => {
    if (err) return res.status(500).send('Error deleting file');
    console.log('File deleted successfully');
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
