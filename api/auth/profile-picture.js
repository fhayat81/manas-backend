const { connectDB } = require('../../lib/db');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');
const multer = require('multer');
const { promisify } = require('util');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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
}).single('profilePicture');

const uploadPromise = promisify(upload);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await auth(req);
    if (!authResult.success) {
      return res.status(401).json({ message: authResult.message });
    }

    // Handle file upload
    await uploadPromise(req, res);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(authResult.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    user.profilePicture = base64Image;
    await user.save();

    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: base64Image
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 