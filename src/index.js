// require("dotenv").config({ path: "./env" });
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./env"
})

const port = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERROR:", error);
        throw error;
    })
    
    app.listen(port, () => {
        console.log(`App is listening on PORT ${port}`);
    })
})
.catch((error) => {
    console.error("MONGODB connection FAILED:", error);
})


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