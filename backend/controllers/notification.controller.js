import { Notification } from "../models/notification.model.js";

export const createNotification = (payload) => Notification.create(payload);

const notificationFilterForUser = (user) => ({
  $or: [
    { recipientId: user._id },
    { recipientRole: user.role, companyId: user.companyId || null },
    { recipientRole: user.role, companyId: null },
  ],
});

export const getNotifications = async (req, res) => {
  try {
    const filter = notificationFilterForUser(req.user);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(30).lean();
    const unreadCount = await Notification.countDocuments({ ...filter, readAt: null });
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...notificationFilterForUser(req.user) },
      { $set: { readAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ notification });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { ...notificationFilterForUser(req.user), readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res.status(200).json({ modified: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
