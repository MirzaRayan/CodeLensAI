import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { deleteReview, getAllReviews, getSingleReview, reviewCode } from "../controllers/review.controllers.js";

const router = Router();



// protected routes

router.route('/review-code').post(verifyJWT, reviewCode)
router.route('/get-reviews').get(verifyJWT, getAllReviews)
router.route('/get-review/:id').get(verifyJWT, getSingleReview)
router.route('/delete-review/:id').delete(verifyJWT, deleteReview)



export default router;