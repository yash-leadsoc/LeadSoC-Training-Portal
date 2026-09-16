const mongoose = require('mongoose');

async function connectDB() {
  // const uri = process.env.MONGO_URI || 'mongodb+srv://yashsoni9902_db_user:PRFv7TbUlUn3PxSL@cluster0.l82k5gk.mongodb.net/?appName=Cluster0';
  const uri =  'mongodb+srv://yashsoni9902_db_user:PRFv7TbUlUn3PxSL@cluster0.l82k5gk.mongodb.net/?appName=Cluster0';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] connected: ${uri}`);
}

module.exports = connectDB;
