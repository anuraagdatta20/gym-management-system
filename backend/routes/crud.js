// Generic CRUD router + business rules (auto expiry, auto invoice, role-based data isolation)
const r = require('express').Router();
const M = require('../models');
const { auth, role } = require('../middleware/auth');

const cfg = {
  members:       { Model: M.Member, pop: 'plan trainer' },
  plans:         { Model: M.Plan },
  trainers:      { Model: M.Trainer },
  payments:      { Model: M.Payment, pop: 'member plan' },
  classes:       { Model: M.GymClass, pop: 'trainer' },
  equipment:     { Model: M.Equipment },
  workouts:      { Model: M.WorkoutPlan, pop: 'member' },
  announcements: { Model: M.Announcement }
};

const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

// Run before create
const before = {
  members: async b => {
    if (b.plan && !b.expiryDate) {
      const p = await M.Plan.findById(b.plan);
      if (p) b.expiryDate = addMonths(b.joinDate || Date.now(), p.durationMonths);
    }
  },
  payments: async b => {
    if (!b.amount && b.plan) { const p = await M.Plan.findById(b.plan); if (p) b.amount = p.price; }
    b.invoiceNo = 'INV-' + Date.now().toString().slice(-8);
  }
};

// Run after create: a payment renews the membership automatically
const after = {
  payments: async d => {
    const p = await M.Plan.findById(d.plan);
    const mem = await M.Member.findById(d.member);
    if (!p || !mem) return;
    const base = mem.expiryDate && mem.expiryDate > new Date() ? mem.expiryDate : new Date();
    mem.expiryDate = addMonths(base, p.durationMonths);
    mem.plan = p._id;
    mem.status = 'Active';
    await mem.save();
  }
};

Object.entries(cfg).forEach(([path, { Model, pop }]) => {
  const base = '/' + path;

  r.get(base, auth, async (req, res) => {
    const f = {};
    // Members only ever see their own records
    if (req.user.role === 'member') {
      if (path === 'members') f._id = req.user.member;
      else if (Model.schema.path('member')) f.member = req.user.member;
    }
    if (req.query.q) {
      const rx = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const keys = ['name', 'title', 'invoiceNo', 'category'].filter(k => Model.schema.path(k));
      if (keys.length) f.$or = keys.map(k => ({ [k]: rx }));
    }
    let q = Model.find(f).sort('-createdAt');
    if (pop) q = q.populate(pop);
    let data = await q.lean();
    if (path === 'members') {
      data = data.map(m => ({
        ...m,
        status: m.status !== 'Frozen' && m.expiryDate && new Date(m.expiryDate) < new Date() ? 'Expired' : m.status
      }));
    }
    res.json(data);
  });

  r.post(base, auth, role('admin', 'trainer'), async (req, res) => {
    try {
      const b = req.body;
      if (before[path]) await before[path](b);
      const d = await Model.create(b);
      if (after[path]) await after[path](d);
      res.status(201).json(d);
    } catch (e) { res.status(400).json({ message: e.message }); }
  });

  r.put(base + '/:id', auth, role('admin', 'trainer'), async (req, res) => {
    try {
      const d = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      res.json(d);
    } catch (e) { res.status(400).json({ message: e.message }); }
  });

  r.delete(base + '/:id', auth, role('admin'), async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  });
});

module.exports = r;
