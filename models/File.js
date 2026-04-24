const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("File", fileSchema);
