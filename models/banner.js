const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const bannerSchema = new mongoose.Schema({
  banner: {
    type: Buffer,
    required: false
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
