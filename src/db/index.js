import dns from "dns"
import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const connectDB = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${DB_NAME}`
        const connectInstance = await mongoose.connect(`${uri}`)
        console.log(`\n database connected !! DB_HOST : ${connectInstance.connection.host} `)
        return connectInstance
    } catch (error) {
        console.log("MONGODB connection failed", error)
        throw error
    }
}

export default connectDB