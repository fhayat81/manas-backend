import express from 'express';
import register from './register';
import login from './login';
import profile from './profile';
import profilePicture from './profile-picture';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', profile);
router.put('/profile-picture', profilePicture);

export default router; 