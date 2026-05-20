import { Router } from "express";
import { getLoggedInUser, loginUser, logoutUser, registerUser, updateUser } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

// public routes

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)


// protected routes

router.route('/get-me').get(verifyJWT, getLoggedInUser)
router.route('/logout').get(verifyJWT, logoutUser)
router.route('/update').patch(verifyJWT, updateUser)

export default router;