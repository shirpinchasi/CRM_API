const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tokenSchema = new Schema({
  userId: {
    type: Number,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,// this is the expiry time in seconds
  },
});
module.exports = mongoose.model("Token", tokenSchema);