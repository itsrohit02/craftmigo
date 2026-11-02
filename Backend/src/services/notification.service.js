import Notification from "../models/notification.model.js";
import { emitToUser } from "../config/socket.js";

export const createNotification = async ({ recipient, type, title, body = "", link = "", relatedBooking, relatedConversation }) => {
  const notification = await Notification.create({ recipient, type, title, body, link, relatedBooking, relatedConversation });
  emitToUser(recipient, "notification:new", { notification });
  return notification;
};
