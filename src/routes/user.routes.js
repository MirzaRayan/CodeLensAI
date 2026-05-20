import { Router } from "express";
import { getLoggedInUser, loginUser, registerUser } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

// public routes

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)


// protected routes

router.route('/get-me').get(verifyJWT, getLoggedInUser)

export default router;