const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
}).single("file");

module.exports = upload;
