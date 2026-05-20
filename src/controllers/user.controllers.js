import { response } from "express";
import { User } from "../models/User.models.js";



const methodForGeneratingAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()

        return accessToken
    } catch (error) {
        console.log('Error generating access token', error);
    }
}

const options = {
    httpOnly: true,
    secure: false,
}


const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            })
        }

        const existedUser = await User.findOne({
            email
        })

        if(existedUser) {
            return res.status(400).json({
                message: 'User already exits with this email'
            })
        }


        const user = await User.create({
            name,
            email,
            password
        })

        const createdUser = await User.findById(user._id).select('-password')

        return res.status(201).json({
            message: 'User Registered Successfully',
            data: createdUser
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server Error while registering user',
            error: error.message
        })
    }
}


const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            })
        }

        const user = await User.findOne({
            email
        })

        if(!user) {
            return res.status(404).json({
                message: 'User not found with this email'
            })
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password)

        if(!isPasswordCorrect) {
            return res.status(400).json({
                message: 'Incorrect password'
            })
        }


        const accessToken = await methodForGeneratingAccessToken(user._id)

        const loggedInUser = await User.findById(user._id).select('-password')

        return res.status(200)
        .cookie('accessToken', accessToken, options)
        .json({
            message: 'User logged in successfully',
            data: loggedInUser,
            accessToken
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server Error while logging in User',
            error: error.message
        })
    }
}


const getLoggedInUser = async (req, res) => {
    try {
        const loggedInUser = await User.findById(req.user._id).select('-password')

        if(!loggedInUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }
        
        return res.status(200).json({
            message: 'loggedIn user fetched successfully',
            data: loggedInUser
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server Error while fetching logged in user',
            error: error.message
        })
    }
}


const logoutUser = async (req, res) => {
    try {
  
      return res
        .status(200)
        .clearCookie("accessToken")
        .json({
          message: "User logged out successfully",
        });
  
    } catch (error) {
  
      console.log(error);
  
      return res.status(500).json({
        message: "Server Error while logging out user",
        error: error.message,
      });
    }
};



 





export {
    registerUser,
    loginUser,
    getLoggedInUser,
    logoutUser
}