require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function viewUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manas');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).select('-password');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('\nRegistered Users:');
      console.log('----------------');
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Phone:', user.phone);
        console.log('Age:', user.age);
        console.log('Marital Status:', user.maritalStatus);
        console.log('Children:', user.children);
        console.log('Education:', user.education);
        console.log('Address:', user.address);
        console.log('City:', user.city);
        console.log('State:', user.state);
        console.log('Country:', user.country);
        console.log('Role:', user.role);
        console.log('Registered on:', user.createdAt);
        console.log('----------------');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

viewUsers(); 