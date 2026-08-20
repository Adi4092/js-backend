import {asyncHandler} from "../utils/asynchandler.js";
import { ApiError } from "../utils/APIerror.js";

const registerUser = asyncHandler(async (req,res) => {
    //get user info from frontend
    //validation - not empty
    //check if user already exist - username,email
    //check for images and avatar
    //check for cloudinary, check avatar
    //upload them to cloudinary,avatar
    //create use object - create entry in db
    //remove password and refresh token from response
    //check for user creation
    //return response

    const {username,email,fullname,password} = req.body
    console.log("email",email);
    
    // if (fullname === "") {
    //     throw new ApiError(400,"fullname is required")
    // }
    //instead of doing this for every field

    if ([username,email,fullname,password].some((field)=>
     field?.trim()==="")) {
        throw new ApiError(400,"all fields are required")
    }

})//we handle text fields in req.body

export {registerUser}