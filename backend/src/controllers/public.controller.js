import { ContactMessage, Notification } from "../models/index.js";
import { asyncHandler, sendSuccess } from "../utils/api.js";

export const publicController = {
  createContactMessage: asyncHandler(async (req, res) => {
    const message = await ContactMessage.create(req.body);
    return sendSuccess(res, message, "Message sent.", 201);
  }),
  listNotifications: asyncHandler(async (req, res) => {
    const filter = {
      $or: [{ audience: "all" }],
    };

    if (req.user) {
      filter.$or.push({ audience: "user", user: req.user._id });
      filter.$or.push({ audience: "role", roles: req.user.role });
    }

    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(30);
    return sendSuccess(res, items);
  }),
  markNotificationRead: asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true },
    );
    return sendSuccess(res, notification, "Notification marked as read.");
  }),
};
