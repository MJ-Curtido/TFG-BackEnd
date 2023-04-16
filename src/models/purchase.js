const mongoose = require("mongoose");

const purchase = mongoose.model('Purchase', {
  date: {
    type: Date,
    default: new Date(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
  },
});

module.exports = purchase;
