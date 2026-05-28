const express = require('express')
const session = require('express-session')
const cors = require('cors')

const db = require('./config/db')

const app = express()
const port = 5000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use(
    session({
        secret: "secretkey",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24,
        },
    })
);

app.use(express.json());

const authRoutes = require('./routes/authRoutes')

app.use('/auth', authRoutes)

app.listen(port, () => {
    console.log(`Server Running http://localhost:${port}`)
})