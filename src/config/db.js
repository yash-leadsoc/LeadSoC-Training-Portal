const mongoose = require('mongoose');

async function connectDB() {
  // const uri = process.env.MONGO_URI || 'mongodb+srv://yashsoni9902_db_user:PRFv7TbUlUn3PxSL@cluster0.l82k5gk.mongodb.net/?appName=Cluster0';
  // const uri =  'mongodb+srv://yashsoni9902_db_user:PRFv7TbUlUn3PxSL@cluster0.l82k5gk.mongodb.net/?appName=Cluster0';
  const uri =  'mongodb://yashsoni9902_db_user:PRFv7TbUlUn3PxSL@ac-lqa9bki-shard-00-00.l82k5gk.mongodb.net:27017,ac-lqa9bki-shard-00-01.l82k5gk.mongodb.net:27017,ac-lqa9bki-shard-00-02.l82k5gk.mongodb.net:27017/?ssl=true&replicaSet=atlas-m9rm1m-shard-0&authSource=admin&appName=Cluster0';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] connected: ${uri}`);
}

module.exports = connectDB;