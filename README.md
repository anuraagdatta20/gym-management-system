# IronPulse - Gym Management System (MERN: MongoDB, Express, React, Node)

## Setup (needs Node.js 18+ and MongoDB running locally)
```
cd backend  && npm install && npm run seed && npm run dev     # API on http://localhost:5000
cd frontend && npm install && npm run dev                      # App on http://localhost:5173
```
Edit `backend/.env` if your MongoDB URI is different (e.g. MongoDB Atlas).

## Demo logins (created by `npm run seed`)
| Role    | Email            | Password   |
|---------|------------------|------------|
| Admin   | admin@gym.com    | admin123   |
| Trainer | trainer@gym.com  | trainer123 |
| Member  | member@gym.com   | member123  |

## Features
1. JWT authentication with 3 roles (Admin, Trainer, Member) and protected routes
2. Member self-registration (creates login + member profile)
3. Members CRUD with search, plan and trainer assignment, auto expiry date
4. Automatic status: Active / Expired / Frozen
5. Membership plans CRUD (price, duration, features)
6. Trainers CRUD (specialization, experience, salary)
7. Payments with auto invoice number, auto amount from plan
8. Payment auto-renews the membership (extends expiry)
9. Printable invoice for every payment
10. Attendance check-in / check-out with duration (blocks expired or frozen members)
11. Group class scheduling + member booking with capacity limit
12. Equipment inventory with Working / Maintenance / Broken status
13. Workout and diet plans assigned per member
14. Progress tracker: weight log + chart
15. BMI with category and maintenance calorie estimate (Mifflin-St Jeor)
16. Admin dashboard: KPI cards, revenue chart, 7-day attendance chart, plan distribution pie
17. Expiry alerts (memberships ending within 7 days)
18. Announcements board
19. CSV export on every table
20. Dark / light mode
21. Role-based data isolation (a member only sees their own records)

## Folder structure
```
backend/   server.js, seed.js, models/index.js (10 collections),
           routes/{auth,crud,extra}.js, middleware/auth.js
frontend/  src/{App,main,api,AuthContext}.jsx, components/{Layout,CrudPage}.jsx,
           pages/{Login,Dashboard,Attendance,Progress,Pages}.jsx
```

## Main API endpoints
- POST /api/auth/login, /api/auth/register
- GET/POST/PUT/DELETE /api/{members,plans,trainers,payments,classes,equipment,workouts,announcements}
- GET /api/attendance, POST /api/attendance/checkin, PUT /api/attendance/checkout/:id
- POST /api/classes/:id/book, POST /api/members/:id/weight
- GET /api/stats (dashboard analytics)

## Collections
User, Member, Plan, Trainer, Attendance, Payment, GymClass, Equipment, WorkoutPlan, Announcement
(Member -> Plan, Trainer | Payment -> Member, Plan | Attendance -> Member | GymClass -> Trainer, Members)
