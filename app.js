import express from 'express'
const app = express();
import cookieParser from 'cookie-parser';
import cors from 'cors'



app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cors())
app.use(cookieParser())




// importing routes

import UserRouter from './src/routes/user.routes.js'


app.use('/api/v1/users', UserRouter)


export default app