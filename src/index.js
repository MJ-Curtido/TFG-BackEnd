const express = require("express");
const cors = require("cors");
require("./db/mongoose");
const userRouter = require("./routers/userRouter");
const recipeRouter = require("./routers/recipeRouter");
const purchaseRouter = require("./routers/purchaseRouter");

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(userRouter);
app.use(recipeRouter);
app.use(purchaseRouter);

app.listen(port, () => {
    console.log(`App listening at: ${port}`);
});
