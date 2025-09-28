import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema ({
    videoFile: {
        type: String, // cloudinary url
        required: true,
    },
    thumbnail: {
        type: String, // cloudinary url
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true // Add index for faster search
    },
    description: {
        type: String,
        trim: true,
        index: true // Add index for faster search
    },
    duration: {
        type: Number, // in seconds
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export const Video = mongoose.model("Video", videoSchema)