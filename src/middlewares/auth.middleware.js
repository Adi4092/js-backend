import { ApiError } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        //token is collected from cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        //check if token exist
        if (!token) {
            throw new ApiError(401, "unauthorized request")
        }

        //check whether token is correct or not & get payload
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        //find user in DB using if from decodedToken
        const user = await User.findById(decodedtoken._id)
            .select("-password -refreshToken")

        //check if user doesnt exist in DB
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        //store user doc in req.user for ease of next middleware/controller
        req.user = user
        next()//pass to next middleware/controller
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})