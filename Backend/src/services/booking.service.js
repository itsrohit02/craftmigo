import Booking, { BOOKING_STATUSES } from "../models/booking.model.js";
import ApiError from "../utils/ApiError.js";

// Defines which transitions are legal and who can perform them
export const ALLOWED_TRANSITIONS = {
  pending: { accepted: "worker", rejected: "worker", cancelled: "customer" },
  accepted: { on_the_way: "worker", cancelled: "customer" },
  on_the_way: { started: "worker" },
  started: { completed: "worker" },
  completed: { paid: "customer" },
};

export const canTransition = (currentStatus, nextStatus, actorRole) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed[nextStatus]) return false;
  return allowed[nextStatus] === actorRole;
};

export const applyStatusChange = async (booking, nextStatus, actorRole, note = "") => {
  if (!BOOKING_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, "Invalid booking status");
  }
  if (!canTransition(booking.status, nextStatus, actorRole)) {
    throw new ApiError(
      400,
      `Cannot move booking from "${booking.status}" to "${nextStatus}" as ${actorRole}`
    );
  }

  booking.status = nextStatus;
  booking.statusHistory.push({ status: nextStatus, note });

  if (nextStatus === "paid") {
    booking.isPaid = true;
    booking.paidAt = new Date();
  }

  await booking.save();
  return booking;
};
