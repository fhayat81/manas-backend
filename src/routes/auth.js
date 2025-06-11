const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const router = express.Router();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMulter = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Register new user
router.post('/register', uploadMulter.single('profilePicture'), async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      password,
      phone,
      age,
      maritalStatus,
      children,
      education,
      address,
      city,
      state,
      country
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      name,
      email,
      password,
      phone,
      age: age ? parseInt(age) : undefined,
      maritalStatus,
      children: children ? parseInt(children) : undefined,
      education,
      address,
      city,
      state,
      country,
      profilePicture: req.file ? `/uploads/profile-pictures/${req.file.filename}` : undefined
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        age: user.age,
        maritalStatus: user.maritalStatus,
        children: user.children,
        education: user.education,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        age: user.age,
        maritalStatus: user.maritalStatus,
        children: user.children,
        education: user.education,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // We already have the user from auth middleware, just need to exclude password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error getting user data' });
  }
});

// Update user profile
router.put('/profile', auth, uploadMulter.single('profilePicture'), async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email or username is being changed and if it's already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already in use' });
      }
    }

    try {
      // Handle profile picture update or removal
      if (req.file) {
        // Delete old profile picture if it exists and is not the default
        if (user.profilePicture && !user.profilePicture.includes('no-profile-pic.svg')) {
          const oldPicturePath = path.join(__dirname, '../../', user.profilePicture);
          if (fs.existsSync(oldPicturePath)) {
            fs.unlinkSync(oldPicturePath);
          }
        }
        updates.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
      } else if (updates.removeProfilePicture === 'true' || updates.profilePicture === '') {
        // Delete old profile picture if it exists and is not the default
        if (user.profilePicture && !user.profilePicture.includes('no-profile-pic.svg')) {
          const oldPicturePath = path.join(__dirname, '../../', user.profilePicture);
          if (fs.existsSync(oldPicturePath)) {
            fs.unlinkSync(oldPicturePath);
          }
        }
        updates.profilePicture = '/images/no-profile-pic.svg';
      }

      // Remove the removeProfilePicture flag from updates
      delete updates.removeProfilePicture;

      // Update user fields
      Object.keys(updates).forEach(update => {
        if (update === 'age' || update === 'children') {
          user[update] = parseInt(updates[update]);
        } else {
          user[update] = updates[update];
        }
      });

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          age: user.age,
          maritalStatus: user.maritalStatus,
          children: user.children,
          education: user.education,
          address: user.address,
          city: user.city,
          state: user.state,
          country: user.country,
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ 
        message: 'Error updating profile',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ 
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

// Upload profile picture
router.post('/profile/picture', auth, uploadMulter.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if it exists and is not the default
    if (user.profilePicture && !user.profilePicture.includes('no-profile-pic.svg')) {
      const oldPicturePath = path.join(__dirname, '../../', user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Save the new profile picture
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 