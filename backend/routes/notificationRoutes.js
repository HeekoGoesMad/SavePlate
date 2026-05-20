const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getNotifications,
  createNotification,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.post('/', auth, createNotification);
router.patch('/:id/read', auth, markRead);
router.patch('/read-all', auth, markAllRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
