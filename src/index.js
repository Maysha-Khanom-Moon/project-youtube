// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
dotenv.config({
    path: "./env"
})

import connectDB from "./db";

connectDB();



/* Way 1:
 * Database connection and express server setup
--------------------------------------------------
import express from "express";
const app = express();

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log("ERROR:", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR:", error);
        throw error;
    }
}) ()

*/