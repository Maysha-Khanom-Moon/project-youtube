import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null
    }
}


const deleteFromCloudinary = async (fileUrl) => {
    try {
        const parts = fileUrl.split("/")
        const filename = parts[parts.length - 1]
        const imageName = filename.split(".")[0]

        const result = await cloudinary.uploader.destroy(imageName)
        return result
    } catch {
        throw new Error("Something went wrong while deleting the file from cloudinary")
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
} 