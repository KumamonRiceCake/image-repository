const express = require('express');
const cookieParser = require('cookie-parser');  // Cookies to store the JWT token on the frontend
require('./db/mongoose');
const userRouter = require('./routers/user');
const imageRouter = require('./routers/image');

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));   // express.urlencoded() middleware parses data sent via forms from the frontend
app.use(cookieParser());    // cookie-parser middleware parses cookies sent with the forms
app.use(userRouter);
app.use(imageRouter);

module.exports = app;