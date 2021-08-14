const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const authRouter = require('./router/auth');
const productRouter = require('./router/product');
const orderRouter = require('./router/order');
const app = express()
const port = 8080

app.use(cors({origin: true, credentials: true}));
app.use(express.json({
    limit : "50mb"
}));
app.use(express.urlencoded({
    limit:"50mb",
    extended: false
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello Express!")
})

app.use('/auth', authRouter);
app.use('/prod', productRouter);
app.use('/order', orderRouter);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
