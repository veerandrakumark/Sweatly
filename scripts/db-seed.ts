import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env config from server subfolder
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sweatly';

// Import Mongoose schemas
import { Sport } from '../server/src/models/sportModel.js';
import { User } from '../server/src/models/userModel.js';
import { SportsGround } from '../server/src/models/sportsGroundModel.js';

const seedData = async () => {
  try {
    console.log(`🚀 Connecting to database: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Clean existing records to avoid duplicates
    console.log('🧹 Cleaning database collections...');
    await Sport.deleteMany({});
    await User.deleteMany({});
    await SportsGround.deleteMany({});

    // 1. Seed Sports Lookups
    console.log('🌱 Seeding Sports...');
    const sports = await Sport.create([
      { name: 'Tennis', slug: 'tennis' },
      { name: 'Soccer', slug: 'soccer' },
      { name: 'Basketball', slug: 'basketball' },
      { name: 'Running', slug: 'running' },
    ]);
    console.log(`✅ Seeded ${sports.length} sports.`);

    const tennisId = sports[0]._id;
    const soccerId = sports[1]._id;

    // 2. Seed Sample Users with GeoJSON Coordinates (New York area)
    console.log('🌱 Seeding Sample Users...');
    const users = await User.create([
      {
        name: 'Sarah Runner',
        email: 'sarah@example.com',
        passwordHash: 'dummy_hash_bcrypt_stub',
        role: 'User',
        preferredSports: [tennisId, sports[3]._id],
        skillLevel: 'intermediate',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128], // Central Park South
        },
      },
      {
        name: 'Marcus Striker',
        email: 'marcus@example.com',
        passwordHash: 'dummy_hash_bcrypt_stub',
        role: 'User',
        preferredSports: [soccerId],
        skillLevel: 'advanced',
        location: {
          type: 'Point',
          coordinates: [-73.9857, 40.7484], // Empire State Building
        },
      },
    ]);
    console.log(`✅ Seeded ${users.length} users.`);

    // 3. Seed Sample Sports Grounds
    console.log('🌱 Seeding Sample Sports Grounds...');
    const grounds = await SportsGround.create([
      {
        name: 'Central Park Tennis Courts',
        address: 'Central Park, New York, NY',
        location: {
          type: 'Point',
          coordinates: [-73.968, 40.778],
        },
        supportedSports: [tennisId],
      },
      {
        name: 'Chelsea Piers Soccer Fields',
        address: '23rd St & Hudson River Park, New York, NY',
        location: {
          type: 'Point',
          coordinates: [-74.01, 40.747],
        },
        supportedSports: [soccerId],
      },
    ]);
    console.log(`✅ Seeded ${grounds.length} grounds.`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
