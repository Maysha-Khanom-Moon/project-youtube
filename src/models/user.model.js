import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema ({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // Add index for faster search
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true // Add index for faster search
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
    }],
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });


// mongoose middleware pre hook to perform actions before saving a user
// Hash password before saving the user
// don't use arrow function, because here we need to access 'this'
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10); // 10 is the salt rounds
    next();
});


// Instance method of schema --> available on every user document
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}


// jwt: it's a bearer token. whom have the token, can access the protected routes
/**
 * --- jwt methods ---
 * .sign: generates a new jwt
 * .verify: verifies if token is valid and not expired
 * .decode: decode the token without verifying
 * 
 */
userSchema.methods.generateAccessToken = function () {
    return jwt.sign (
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        }, // payload: data stored in jwt
        process.env.ACCESS_TOKEN_SECRET, // secret
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        } // options
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign (
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);