import { User } from "../models/User.models.js";


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
            message: 'Internal Server Error',
            error: error.message
        })
    }
}



export {
    registerUser
}