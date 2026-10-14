// Run: npm run seed  -> fills the database with demo data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');

const addDays = n => new Date(Date.now() + n * 864e5);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all(Object.values(M).map(Model => Model.deleteMany({})));

  const plans = await M.Plan.insertMany([
    { name: 'Basic', price: 1000, durationMonths: 1, features: ['Gym floor access', 'Locker'] },
    { name: 'Standard', price: 2700, durationMonths: 3, features: ['Gym floor access', 'Group classes', 'Locker'] },
    { name: 'Premium', price: 9000, durationMonths: 12, features: ['All access', 'Personal trainer', 'Diet plan', 'Steam room'] }
  ]);
  const trainers = await M.Trainer.insertMany([
    { name: 'Rahul Verma', email: 'rahul@gym.com', phone: '9000000001', specialization: 'Strength & Conditioning', experience: 6, salary: 30000 },
    { name: 'Sneha Rao', email: 'sneha@gym.com', phone: '9000000002', specialization: 'Yoga & Zumba', experience: 4, salary: 25000 }
  ]);
  const names = ['Arjun Kumar', 'Priya Sharma', 'Kiran Reddy', 'Meena Iyer', 'Vikas Singh', 'Anita Das'];
  const members = [];
  for (let i = 0; i < names.length; i++) {
    members.push(await M.Member.create({
      name: names[i], email: `member${i + 1}@mail.com`, phone: '98000000' + (10 + i),
      age: 20 + i * 3, gender: i % 2 ? 'Female' : 'Male', height: 160 + i * 3, weight: 60 + i * 4,
      plan: plans[i % 3]._id, trainer: trainers[i % 2]._id, joinDate: addDays(-60),
      expiryDate: i === 4 ? addDays(-5) : i === 3 ? addDays(4) : addDays(30 + i * 20),
      weightLog: [{ date: addDays(-42), weight: 64 + i * 4 }, { date: addDays(-21), weight: 62 + i * 4 }, { date: addDays(-1), weight: 60 + i * 4 }]
    }));
  }
  for (let i = 0; i < members.length; i++)
    for (let k = 0; k < 3; k++)
      await M.Payment.create({ member: members[i]._id, plan: plans[i % 3]._id, amount: plans[i % 3].price, method: ['Cash', 'UPI', 'Card'][k], date: addDays(-k * 30 - i), invoiceNo: `INV-${1000 + i * 3 + k}` });

  for (let d = 0; d < 7; d++)
    for (let i = 0; i < 4; i++) {
      const t = addDays(-d); t.setHours(7 + i, 10);
      await M.Attendance.create({ member: members[(i + d) % 4]._id, checkIn: t, checkOut: d ? new Date(t.getTime() + 75 * 60000) : null });
    }

  await M.GymClass.insertMany([
    { title: 'Morning Yoga', trainer: trainers[1]._id, day: 'Mon/Wed/Fri', time: '06:00 AM', capacity: 15 },
    { title: 'HIIT Blast', trainer: trainers[0]._id, day: 'Tue/Thu', time: '07:00 AM', capacity: 12 },
    { title: 'Zumba Party', trainer: trainers[1]._id, day: 'Sat', time: '05:00 PM', capacity: 25 }
  ]);
  await M.Equipment.insertMany([
    { name: 'Treadmill', category: 'Cardio', quantity: 8, status: 'Working', lastService: addDays(-30) },
    { name: 'Leg Press', category: 'Strength', quantity: 2, status: 'Maintenance', lastService: addDays(-90) },
    { name: 'Dumbbell Set', category: 'Free Weights', quantity: 20, status: 'Working', lastService: addDays(-10) },
    { name: 'Rowing Machine', category: 'Cardio', quantity: 3, status: 'Broken', lastService: addDays(-120) }
  ]);
  await M.WorkoutPlan.create({
    member: members[0]._id, title: 'Fat Loss - 4 week', goal: 'Weight Loss',
    exercises: 'Squats 4x12\nBench Press 4x10\nDeadlift 3x8\nTreadmill 20 min',
    diet: 'High protein, 1800 kcal/day, 3L water, no sugary drinks'
  });
  await M.Announcement.create({ title: 'Diwali Timings', message: 'Gym open 6 AM - 12 PM on Diwali. Happy Diwali!' });

  const hash = p => bcrypt.hash(p, 10);
  await M.User.create([
    { name: 'Admin', email: 'admin@gym.com', password: await hash('admin123'), role: 'admin' },
    { name: 'Rahul Verma', email: 'trainer@gym.com', password: await hash('trainer123'), role: 'trainer' },
    { name: members[0].name, email: 'member@gym.com', password: await hash('member123'), role: 'member', member: members[0]._id }
  ]);

  console.log('Seeded! Logins -> admin@gym.com/admin123 | trainer@gym.com/trainer123 | member@gym.com/member123');
  process.exit();
})();
