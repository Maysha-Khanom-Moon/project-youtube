import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from './../models/user.model.js';
import uploadOnCloudinary from './../utils/cloudinary.js';
import ApiResponse from './../utils/ApiResponse.js';

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
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
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
        coverImage: coverImage?.url || ""
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

export default registerUser