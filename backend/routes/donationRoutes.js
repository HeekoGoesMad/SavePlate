const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDonations,
  getMyDonations,
  createDonation,
  claimDonation,
  cancelClaim,
  completeDonation,
} = require('../controllers/donationController');

router.get('/', auth, getDonations);
router.get('/mine', auth, getMyDonations);
router.post('/', auth, createDonation);
router.patch('/:id/claim', auth, claimDonation);
router.patch('/:id/cancel', auth, cancelClaim);
router.patch('/:id/complete', auth, completeDonation);

module.exports = router;
