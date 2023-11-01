const mongoose = require('mongoose')
require('dotenv').config()

const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL, {useNewUrlParser : true})
.then((res) => {
    console.log(`database connected succefully`);
})
.catch((err) => {
    console.log(`an error occured during the connection establishing` + err);
})

module.exports = mongoose;