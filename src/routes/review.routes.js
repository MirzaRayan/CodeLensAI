import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { getAllReviews, reviewCode } from "../controllers/review.controllers.js";

const router = Router();



// protected routes

router.route('/review-code').post(verifyJWT, reviewCode)
router.route('/get-reviews').get(verifyJWT, getAllReviews)



export default router;