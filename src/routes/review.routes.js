import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { reviewCode } from "../controllers/review.controllers.js";

const router = Router();


router.route('/review-code').post(verifyJWT, reviewCode)



export default router;