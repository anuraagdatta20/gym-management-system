const r = require('express').Router();
const M = require('../models');
const { auth, role } = require('../middleware/auth');

const memberId = req => (req.user.role === 'member' ? req.user.member : req.body.member);
const DAY = 864e5;

// ---------- Attendance ----------
r.get('/attendance', auth, async (req, res) => {
  const f = req.user.role === 'member' ? { member: req.user.member } : {};
  res.json(await M.Attendance.find(f).populate('member', 'name').sort('-checkIn').limit(100).lean());
});

r.post('/attendance/checkin', auth, async (req, res) => {
  const id = memberId(req);
  if (!id) return res.status(400).json({ message: 'Select a member' });
  const mem = await M.Member.findById(id);
  if (!mem) return res.status(404).json({ message: 'Member not found' });
  if (mem.status === 'Frozen') return res.status(400).json({ message: 'Membership is frozen' });
  if (!mem.expiryDate || mem.expiryDate < new Date()) return res.status(400).json({ message: 'No active membership - please renew' });
  if (await M.Attendance.findOne({ member: id, checkOut: null })) return res.status(400).json({ message: 'Already checked in' });
  res.status(201).json(await M.Attendance.create({ member: id }));
});

r.put('/attendance/checkout/:id', auth, async (req, res) => {
  res.json(await M.Attendance.findByIdAndUpdate(req.params.id, { checkOut: new Date() }, { new: true }));
});

// ---------- Class booking ----------
r.post('/classes/:id/book', auth, async (req, res) => {
  const c = await M.GymClass.findById(req.params.id);
  const id = memberId(req);
  if (!c) return res.status(404).json({ message: 'Class not found' });
  if (c.bookings.some(b => String(b) === String(id))) return res.status(400).json({ message: 'Already booked' });
  if (c.bookings.length >= c.capacity) return res.status(400).json({ message: 'Class is full' });
  c.bookings.push(id);
  await c.save();
  res.json(c);
});

// ---------- Progress tracking ----------
r.post('/members/:id/weight', auth, async (req, res) => {
  if (req.user.role === 'member' && String(req.user.member) !== req.params.id)
    return res.status(403).json({ message: 'Access denied' });
  const m = await M.Member.findById(req.params.id);
  if (!m) return res.status(404).json({ message: 'Member not found' });
  m.weightLog.push({ weight: req.body.weight });
  m.weight = req.body.weight;
  await m.save();
  res.json(m);
});

// ---------- Dashboard analytics ----------
r.get('/stats', auth, role('admin', 'trainer'), async (req, res) => {
  const now = new Date();
  const [members, payments, att, equip, trainers, ann] = await Promise.all([
    M.Member.find().populate('plan', 'name').lean(),
    M.Payment.find().lean(),
    M.Attendance.find({ checkIn: { $gte: new Date(Date.now() - 7 * DAY) } }).lean(),
    M.Equipment.find().lean(),
    M.Trainer.countDocuments(),
    M.Announcement.find().sort('-createdAt').limit(3).lean()
  ]);

  const expired = members.filter(m => m.expiryDate && m.expiryDate < now && m.status !== 'Frozen');
  const expiring = members
    .filter(m => m.expiryDate && m.expiryDate >= now && m.expiryDate <= new Date(Date.now() + 7 * DAY))
    .map(m => ({ _id: m._id, name: m.name, phone: m.phone, expiryDate: m.expiryDate }));

  const revenue = [];
  for (let i = 5; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
    revenue.push({
      month: s.toLocaleString('en', { month: 'short' }),
      amount: payments.filter(p => p.date >= s && p.date < e).reduce((t, p) => t + p.amount, 0)
    });
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendance = [];
  for (let i = 6; i >= 0; i--) {
    const s = new Date(today.getTime() - i * DAY);
    const e = new Date(s.getTime() + DAY);
    attendance.push({ day: s.toLocaleString('en', { weekday: 'short' }), count: att.filter(a => a.checkIn >= s && a.checkIn < e).length });
  }

  const dist = {};
  members.forEach(m => { const n = m.plan?.name || 'No plan'; dist[n] = (dist[n] || 0) + 1; });

  res.json({
    totalMembers: members.length,
    active: members.length - expired.length,
    expired: expired.length,
    trainers,
    totalRevenue: payments.reduce((t, p) => t + p.amount, 0),
    todayCheckins: att.filter(a => a.checkIn >= today).length,
    equipmentIssues: equip.filter(e => e.status !== 'Working').length,
    expiring, revenue, attendance,
    planDist: Object.entries(dist).map(([name, value]) => ({ name, value })),
    announcements: ann
  });
});

module.exports = r;
