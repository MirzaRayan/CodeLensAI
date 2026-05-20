import express from 'express'
const app = express();
import cookieParser from 'cookie-parser';
import cors from 'cors'



app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cors())
app.use(cookieParser())


export default app