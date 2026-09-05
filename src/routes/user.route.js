import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),//for multiple field + files
    //upload.array() --> single field + multiple files
    //upload.single() --> single field + single file
    registerUser
)//We handle files in req.files

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-user").get(verifyJWT, getCurrentUser)
router.route("/update-acc-details").post(verifyJWT, updateAccountDetails)
router.route("/update-user-avatar").post(verifyJWT, upload, updateUserAvatar)
router.route("/update-user-cover").post(verifyJWT, upload, updateUserCoverImage)


export default router