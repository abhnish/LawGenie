// Simple placeholder handler
const uploadDoc = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "File uploaded successfully ✅",
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
};

module.exports = { uploadDoc };
