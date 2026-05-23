const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a notification (internal use / system-generated)
exports.createNotification = async (req, res) => {
  try {
    const { type, message, link } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: 'Type and message are required.' });
    }

    const notification = await Notification.create({
      userId: req.user.id,
      type,
      message,
      link: link || 'notifications',
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark a single notification as read
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { returnDocument: 'after' }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark all notifications as read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });

    res.json({ message: 'Notification deleted.', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
