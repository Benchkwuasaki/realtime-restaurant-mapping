require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const restaurants = [
  { name: "Luna Ristoranti", category: "Italian", rating: 4, visited: false, notes: "", location: { type: "Point", coordinates: [124.6629, 9.2430] } },
  { name: "Mat's Restobar", category: "Bar & Grill", rating: 3, visited: false, notes: "", location: { type: "Point", coordinates: [124.6622, 9.2418] } },
  { name: "Pipa Cafe", category: "Cafe", rating: 4, visited: false, notes: "", location: { type: "Point", coordinates: [124.6598, 9.2435] } },
  { name: "Paradiso Pizza", category: "Pizza", rating: 5, visited: false, notes: "", location: { type: "Point", coordinates: [124.6615, 9.2458] } },
  { name: "Alex", category: "Restaurant", rating: 3, visited: false, notes: "", location: { type: "Point", coordinates: [124.6638, 9.2412] } },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Restaurant.deleteMany({});
  await Restaurant.insertMany(restaurants);
  console.log('Seeded', restaurants.length, 'restaurants!');
  process.exit();
}).catch(err => { console.log(err); process.exit(1); });