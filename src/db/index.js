import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// DB is in another continent, so it may take time to connect
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host} \n`);

    } catch (error) {
        console.log('MONGODB connection FAILED', error);
        process.exit(1);
    }
}

export default connectDB;