const express = require("express");
const path = require("path");
const session = require("express-session");
const hbs = require('express-handlebars');
const flash = require('express-flash')
const cookieParser = require('cookie-parser');
const nocache = require('nocache')
const adminRouter = require('./routes/adminRoutes')
const userRouter = require('./routes/userRoutes');
const app = express();
require("dotenv").config();
require('./config/dbconnection')

app.engine('hbs', 
    hbs.engine({ 
        extname: '.hbs', 
        defaultLayout: "layout",
        layoutsDir: __dirname + '/views/layouts/',
        partialsDir: __dirname + '/views/partials/'
    })
);

app.set('view engine', 'hbs')

app.set('views', path.join(__dirname,'views'))
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser());
app.use(flash())
app.use(nocache())

const maxAge = 3 * 24 * 60 * 1000
const SECRET = process.env.SECRET

app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: maxAge}
}))



app.use('/admin', adminRouter)
app.use('/', userRouter)
app.use('*', (req, res) => {
    res.render('error')
})



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server started at PORT ${PORT}`);
});
