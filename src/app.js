const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const imageRouter = require('./routers/image');

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(imageRouter);

module.exports = app;