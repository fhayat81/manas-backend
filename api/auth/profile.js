const { connectDB } = require('../../lib/db');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Authenticate user
    const authResult = await auth(req);
    if (!authResult.success) {
      return res.status(401).json({ message: authResult.message });
    }

    const user = await User.findById(authResult.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.method === 'GET') {
      return res.json(user);
    }

    // Handle PUT request
    const { name, email, phone, age, maritalStatus, children, education } = req.body;

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (age) user.age = age;
    if (maritalStatus) user.maritalStatus = maritalStatus;
    if (children) user.children = children;
    if (education) user.education = education;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Profile operation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 