import express from 'express';
import { auth } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

router.put('/profile-picture', auth, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Profile picture update error:', error);
    res.status(500).json({ error: 'Error updating profile picture' });
  }
});

export default router; 