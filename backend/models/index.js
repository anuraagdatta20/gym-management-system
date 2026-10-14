const m = require('mongoose');
const S = m.Schema;
const ref = n => ({ type: S.Types.ObjectId, ref: n });
const T = { timestamps: true };

const User = new S({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'trainer', 'member'], default: 'member' },
  member: ref('Member')
}, T);

const Plan = new S({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  features: [String]
}, T);

const Trainer = new S({
  name: { type: String, required: true },
  email: String, phone: String, specialization: String,
  experience: Number, salary: Number
}, T);

const Member = new S({
  name: { type: String, required: true },
  email: String, phone: String, age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  height: Number, weight: Number,
  plan: ref('Plan'), trainer: ref('Trainer'),
  joinDate: { type: Date, default: Date.now },
  expiryDate: Date,
  status: { type: String, enum: ['Active', 'Expired', 'Frozen'], default: 'Active' },
  weightLog: [{ date: { type: Date, default: Date.now }, weight: Number }]
}, T);

const Attendance = new S({
  member: ref('Member'),
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date, default: null }
}, T);

const Payment = new S({
  member: { ...ref('Member'), required: true },
  plan: ref('Plan'),
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash', 'UPI', 'Card'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  invoiceNo: String
}, T);

const GymClass = new S({
  title: { type: String, required: true },
  trainer: ref('Trainer'),
  day: String, time: String,
  capacity: { type: Number, default: 20 },
  bookings: [ref('Member')]
}, T);

const Equipment = new S({
  name: { type: String, required: true },
  category: String,
  quantity: { type: Number, default: 1 },
  status: { type: String, enum: ['Working', 'Maintenance', 'Broken'], default: 'Working' },
  lastService: Date
}, T);

const WorkoutPlan = new S({
  member: ref('Member'),
  title: { type: String, required: true },
  goal: String, exercises: String, diet: String
}, T);

const Announcement = new S({
  title: { type: String, required: true },
  message: String
}, T);

module.exports = {
  User: m.model('User', User), Plan: m.model('Plan', Plan), Trainer: m.model('Trainer', Trainer),
  Member: m.model('Member', Member), Attendance: m.model('Attendance', Attendance),
  Payment: m.model('Payment', Payment), GymClass: m.model('GymClass', GymClass),
  Equipment: m.model('Equipment', Equipment), WorkoutPlan: m.model('WorkoutPlan', WorkoutPlan),
  Announcement: m.model('Announcement', Announcement)
};
