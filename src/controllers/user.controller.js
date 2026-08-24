import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/APIerror.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { APIresponse } from "../utils/APIresponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user info from frontend
    //validation - not empty
    //check if user already exist - username,email
    //check for images and avatar
    //check for cloudinary, check avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token from response
    //check for user creation
    //return response

    //get user info from frontend
    const { username, email, fullname, password } = req.body
    //console.log("email", email);

    // if (fullname === "") {
    //     throw new ApiError(400,"fullname is required")
    // }
    //instead of doing this for every field


    //validation
    if ([username, email, fullname, password].some((field) =>
        field?.trim() === "")) { //We handle text fields in req.body
        throw new ApiError(400, "all fields are required")
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "invalid email format")
    }

    //check if user already exist
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    //----------OR-------------- for coverImage 
    // let coverImageLocalPath//check for coverImage
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    //upload avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //Image uploading takes time

    //check if avatar is uploaded nor not
    if (!avatar) {
        throw new ApiError(400, "avatar file is not uploaded")
    }


    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //check for user creation
    const CreatedUser = await User.findById(user._id).select(
        "-password -refreshToken"
        //removes password and refreshtoken field from response
    )//_id => mongoBD stores a uniquw id with every document in the collection
    //We can use it to find the user we just created.

    if (!CreatedUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new APIresponse(200, "user registered successfully", CreatedUser)
    )
})

export { registerUser }