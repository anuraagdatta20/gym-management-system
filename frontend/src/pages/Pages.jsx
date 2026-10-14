import CrudPage from '../components/CrudPage';
import api from '../api';
import { useAuth } from '../AuthContext';

const money = v => '₹' + Number(v || 0).toLocaleString('en-IN');
const dt = v => (v ? new Date(v).toLocaleDateString('en-IN') : '-');
const badge = v => <span className={'badge ' + String(v).toLowerCase()}>{v}</span>;

export const Members = () => (
  <CrudPage title="Members" endpoint="members"
    columns={[
      { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
      { key: 'plan', label: 'Plan' }, { key: 'trainer', label: 'Trainer' },
      { key: 'expiryDate', label: 'Expires' },
      { key: 'status', label: 'Status', render: r => badge(r.status) }
    ]}
    fields={[
      { name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' }, { name: 'age', label: 'Age', type: 'number' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'height', label: 'Height (cm)', type: 'number' }, { name: 'weight', label: 'Weight (kg)', type: 'number' },
      { name: 'plan', label: 'Plan', ref: 'plans' }, { name: 'trainer', label: 'Trainer', ref: 'trainers' },
      { name: 'joinDate', label: 'Join date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry (auto if blank)', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Frozen'] }
    ]} />
);

export const Plans = () => (
  <CrudPage title="Membership Plans" endpoint="plans"
    columns={[
      { key: 'name', label: 'Plan' },
      { key: 'price', label: 'Price', render: r => money(r.price) },
      { key: 'durationMonths', label: 'Months' },
      { key: 'features', label: 'Features' }
    ]}
    fields={[
      { name: 'name', label: 'Plan name', required: true },
      { name: 'price', label: 'Price (₹)', type: 'number', required: true },
      { name: 'durationMonths', label: 'Duration (months)', type: 'number', required: true },
      { name: 'features', label: 'Features (comma separated)', type: 'list' }
    ]} />
);

export const Trainers = () => (
  <CrudPage title="Trainers" endpoint="trainers"
    columns={[
      { key: 'name', label: 'Name' }, { key: 'specialization', label: 'Specialization' },
      { key: 'experience', label: 'Exp (yrs)' }, { key: 'phone', label: 'Phone' },
      { key: 'salary', label: 'Salary', render: r => money(r.salary) }
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true }, { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' }, { name: 'specialization', label: 'Specialization' },
      { name: 'experience', label: 'Experience (yrs)', type: 'number' },
      { name: 'salary', label: 'Salary (₹)', type: 'number' }
    ]} />
);

// Printable invoice
const printInvoice = p => {
  const w = window.open('', '_blank', 'width=700,height=600');
  w.document.write(`<html><head><title>${p.invoiceNo}</title>
  <style>body{font-family:Arial;padding:40px}h1{color:#e63946}table{width:100%;border-collapse:collapse;margin-top:20px}
  td,th{border:1px solid #ccc;padding:10px;text-align:left}.t{text-align:right;font-size:20px;margin-top:20px}</style></head><body>
  <h1>IronPulse Gym</h1><p>Invoice: <b>${p.invoiceNo}</b><br>Date: ${dt(p.date)}</p>
  <p>Billed to: <b>${p.member?.name || '-'}</b></p>
  <table><tr><th>Description</th><th>Method</th><th>Amount</th></tr>
  <tr><td>${p.plan?.name || 'Membership'} plan</td><td>${p.method}</td><td>₹${p.amount}</td></tr></table>
  <div class="t">Total: <b>₹${p.amount}</b></div><p>Thank you for training with us!</p>
  <script>window.print()</script></body></html>`);
  w.document.close();
};

export const Payments = () => (
  <CrudPage title="Payments & Invoices" endpoint="payments"
    columns={[
      { key: 'invoiceNo', label: 'Invoice' }, { key: 'member', label: 'Member' }, { key: 'plan', label: 'Plan' },
      { key: 'amount', label: 'Amount', render: r => money(r.amount) },
      { key: 'method', label: 'Method' }, { key: 'date', label: 'Date' }
    ]}
    fields={[
      { name: 'member', label: 'Member', ref: 'members', required: true },
      { name: 'plan', label: 'Plan (renews membership)', ref: 'plans' },
      { name: 'amount', label: 'Amount (auto from plan if blank)', type: 'number' },
      { name: 'method', label: 'Method', type: 'select', options: ['Cash', 'UPI', 'Card'] }
    ]}
    rowActions={r => <button className="btn sm" onClick={() => printInvoice(r)}>Invoice</button>} />
);

export const Classes = () => {
  const { user } = useAuth();
  const book = async (id, reload) => {
    try { await api.post(`/classes/${id}/book`, {}); alert('Class booked!'); reload(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };
  return (
    <CrudPage title="Group Classes" endpoint="classes"
      columns={[
        { key: 'title', label: 'Class' }, { key: 'trainer', label: 'Trainer' },
        { key: 'day', label: 'Days' }, { key: 'time', label: 'Time' },
        { key: 'seats', label: 'Booked', render: r => `${r.bookings?.length || 0} / ${r.capacity}` }
      ]}
      fields={[
        { name: 'title', label: 'Class title', required: true }, { name: 'trainer', label: 'Trainer', ref: 'trainers' },
        { name: 'day', label: 'Days (e.g. Mon/Wed)' }, { name: 'time', label: 'Time (e.g. 6:00 AM)' },
        { name: 'capacity', label: 'Capacity', type: 'number' }
      ]}
      rowActions={(r, reload) => user.role === 'member' && <button className="btn sm" onClick={() => book(r._id, reload)}>Book</button>} />
  );
};

export const Equipment = () => (
  <CrudPage title="Equipment Inventory" endpoint="equipment"
    columns={[
      { key: 'name', label: 'Equipment' }, { key: 'category', label: 'Category' }, { key: 'quantity', label: 'Qty' },
      { key: 'status', label: 'Status', render: r => badge(r.status) }, { key: 'lastService', label: 'Last service' }
    ]}
    fields={[
      { name: 'name', label: 'Name', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Cardio', 'Strength', 'Free Weights', 'Accessories'] },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Working', 'Maintenance', 'Broken'] },
      { name: 'lastService', label: 'Last service', type: 'date' }
    ]} />
);

export const Workouts = () => (
  <CrudPage title="Workout & Diet Plans" endpoint="workouts"
    columns={[
      { key: 'member', label: 'Member' }, { key: 'title', label: 'Plan' }, { key: 'goal', label: 'Goal' },
      { key: 'exercises', label: 'Exercises', render: r => <pre className="pre">{r.exercises}</pre> },
      { key: 'diet', label: 'Diet' }
    ]}
    fields={[
      { name: 'member', label: 'Member', ref: 'members', required: true },
      { name: 'title', label: 'Plan title', required: true },
      { name: 'goal', label: 'Goal', type: 'select', options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility'] },
      { name: 'exercises', label: 'Exercises (one per line)', type: 'textarea' },
      { name: 'diet', label: 'Diet plan', type: 'textarea' }
    ]} />
);

export const Announcements = () => (
  <CrudPage title="Announcements" endpoint="announcements"
    columns={[{ key: 'title', label: 'Title' }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Posted on' }]}
    fields={[
      { name: 'title', label: 'Title', required: true },
      { name: 'message', label: 'Message', type: 'textarea' }
    ]} />
);
