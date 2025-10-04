import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from './../models/user.model.js';
import { deleteFromCloudinary, uploadOnCloudinary } from './../utils/cloudinary.js';
import ApiResponse from './../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar (multer will store it locally)
    // upload them to cloudinary avatar url
    // create user object - create entry in db
    // remove password and refreshToken from response
    // check for user creation
    // return response

    // 1.
    const { username, email, fullname, password } = req.body
    console.log("email: ", email);

    // 2.
    if (
        [username, email, fullname, password].some((item) => item?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    
    // 3.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // 4.
    const avatarLocalPath = req.files?.avatar[0]?.path //multiple files => upload.fields([{ ... }, { ... }, ...])
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // prevent undefined, we have to go for classic way
    let coverImageLocalPath
    if (req.files?.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    } else {
        coverImageLocalPath = ""
    }
    
    // 5.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // 6.
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "" // sometimes optional chaining in undefined will throw error
    })

    // 7.
    const createdUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    )

    // 8.
    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    // 9.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler ( async (req, res) => {
    // req body --> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies
    // return response

    // 1.
    const { email, username, password } = req.body

    // 2.
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // 3.
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 4.
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect");
    }

    // 5.
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    // 6, 7
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})


const logoutUser = asyncHandler( async (req, res) => {
    // clear refreshToken
    // clear cookies
    // return response

    // 1.
    await User.findByIdAndUpdate(
        req.user._id, 
        { $unset: { refreshToken: 1 } },
        { new: true }
    )

    // 2, 3
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )
})


const refreshAccessToken = asyncHandler( async (req, res) => {
    // 1.
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    // 2.
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        // 3.
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        // 4. 
        const options = {
            httpOnly: true,
            secure: true
        }
        
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    )
}) 

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )
})

// for file upload should use different function
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path // upload single file => upload.single("avatar")
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Error while uploading avatar")
    }

    // existing avatar url
    const oldAvatar = req.user.avatar

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    // delete old avatar from cloudinary
    if (oldAvatar && oldAvatar !== avatar.url) {
        await deleteFromCloudinary(oldAvatar)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalLocalPath = req.file?.path
    if (!coverLocalLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalLocalPath)
    if (!coverImage) {
        throw new ApiError(500, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() } 
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { 
                    $size: "$subscribers" 
                },
                channelSubscribedToCount: { 
                    $size: "$subscribedTo" 
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}