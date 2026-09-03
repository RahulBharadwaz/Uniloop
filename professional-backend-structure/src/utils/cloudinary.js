import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from "./ApiError.js"
import dotenv from 'dotenv'

dotenv.config(
    {
        path: '\.env'
    }

)

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return new ApiError(
            401,
            "localfilePath not found"
        )

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        //file successfully uploaded
        // console.log('file is uploaded on cloudinary', response.url);
        fs.unlinkSync(localFilePath) 

        return response;

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw new ApiError(
            500,
            `Cloudinary error: ${error.message || error}`
        )
    }
}

export { uploadOnCloudinary }

// Upload an image
// const uploadResult = await cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
//     )
//     .catch((error) => {
//         console.log(error);
//     });