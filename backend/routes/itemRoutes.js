const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getItems,
  addItem,
  updateItem,
  updateStatus,
  deleteItem,
} = require('../controllers/itemController');

router.get('/', auth, getItems);
router.post('/', auth, addItem);
router.put('/:id', auth, updateItem);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteItem);

module.exports = router;
