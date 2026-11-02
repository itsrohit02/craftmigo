import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBookingDetails,
  acceptBooking,
  rejectBooking,
  markOnTheWay,
  startBooking,
  completeBooking,
  cancelBooking,
  markBookingPaid,
} from "../controllers/booking.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", authorizeRoles("user", "worker"), createBooking);
router.get("/customer", authorizeRoles("user", "worker"), getCustomerBookings);
router.get("/worker", authorizeRoles("worker"), getWorkerBookings);
router.get("/:id", getBookingDetails);

router.patch("/:id/accept", authorizeRoles("worker"), acceptBooking);
router.patch("/:id/reject", authorizeRoles("worker"), rejectBooking);
router.patch("/:id/on-the-way", authorizeRoles("worker"), markOnTheWay);
router.patch("/:id/start", authorizeRoles("worker"), startBooking);
router.patch("/:id/complete", authorizeRoles("worker"), completeBooking);
router.patch("/:id/cancel", authorizeRoles("user", "worker"), cancelBooking);
router.patch("/:id/pay", authorizeRoles("user", "worker"), markBookingPaid);

export default router;
