import express from 'express';
import register from './register.js';
import login from './login.js';
import profile from './profile.js';
import profilePicture from './profile-picture.js';

const router = express.Router();

router.use('/register', register);
router.use('/login', login);
router.use('/profile', profile);
router.use('/profile-picture', profilePicture);

export default router; 