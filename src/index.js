import dotenv from "dotenv"
//import express from "express"
import connectDB from "./db/index.js"
import { app } from "./app.js"
import { log } from "console"

dotenv.config({
    path: "./.env"
})

//const app = express()

/*
import express from "express"
const app=express()



(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("error:",error)
        })

        app.listen(process.env.PORT,() => {
            console.log(`app is listening on ${process.env.PORT}`     
            )
        })
    } catch (error) {
        console.log("ERROR:",error)
        throw error
    }
})()
*/

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log(`server is not responding!!`, error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`server is running on port : ${process.env.PORT || 8000}`)
        })
    })
    .catch((error) => {
        console.log(`MONGO DB connection failed!!`, error)
    })