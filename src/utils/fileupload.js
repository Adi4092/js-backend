import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //file system =>to work with files on your server 
//for example deleting a temporary file after uploading it to Cloudinary.

const uploadOnCloudinary = async (localeFilePath) => {
    try {
        if(!localeFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localeFilePath,{
            resource_type:"auto"
        })
        //file is uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response 
    } catch (error) {
        fs.unlinkSync(localeFilePath)//removes the locally saved temporary file 
        //as the upload operation got failed
        return null
    }
}

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});