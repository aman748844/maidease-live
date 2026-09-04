const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const MAIDS_FILE = path.join(__dirname, 'data', 'maids.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const CALLS_FILE = path.join(__dirname, 'data', 'calls.json');

// Ensure data files exist
function loadData(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error loading data from ${filePath}:`, err);
    return defaultData;
  }
}

function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving data to ${filePath}:`, err);
  }
}

// Initial data load
let maids = loadData(MAIDS_FILE, []);
let bookings = loadData(BOOKINGS_FILE, [
  {
    id: "BK-1001",
    maidId: "maid_1",
    maidName: "Sunita Devi",
    customerName: "Rahul Saxena",
    customerPhone: "+91 99887 76655",
    address: "Flat 402, Palm Heights, Indiranagar",
    serviceType: "Cooking & Kitchen Cleaning",
    frequency: "instant",
    scheduledTime: "ASAP (Instant 20-min)",
    status: "in_progress",
    totalAmount: 349,
    paymentMethod: "Cash after service",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    etaRemainingMins: 0,
    notes: "Please make dinner for 3 people (Roti, Dal, Paneer)."
  }
]);
let callLogs = loadData(CALLS_FILE, []);

// 1. Get All Maids (with real-time filtering)
app.get('/api/maids', (req, res) => {
  const { service, status, search, maxDistance, maxPrice } = req.query;
  let filtered = [...maids];

  if (service && service !== 'all') {
    filtered = filtered.filter(m => 
      m.services.some(s => s.toLowerCase().includes(service.toLowerCase())) ||
      m.specialties.some(sp => sp.toLowerCase().includes(service.toLowerCase()))
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(m => m.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.tagline.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.services.some(s => s.toLowerCase().includes(q)) ||
      m.languages.some(l => l.toLowerCase().includes(q))
    );
  }

  if (maxDistance) {
    filtered = filtered.filter(m => m.distanceKm <= parseFloat(maxDistance));
  }

  if (maxPrice) {
    filtered = filtered.filter(m => m.pricing.hourlyRate <= parseFloat(maxPrice));
  }

  res.json({
    success: true,
    total: filtered.length,
    availableCount: maids.filter(m => m.status === 'available').length,
    maids: filtered
  });
});

// 2. Get Single Maid by ID
app.get('/api/maids/:id', (req, res) => {
  const maid = maids.find(m => m.id === req.params.id);
  if (!maid) {
    return res.status(404).json({ success: false, message: 'Home maid not found' });
  }
  res.json({ success: true, maid });
});

// 3. Update Maid Real-Time Status (Online/Available, Busy, Offline)
app.put('/api/maids/:id/status', (req, res) => {
  const { status, busyUntil, etaMins } = req.body;
  const index = maids.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maid not found' });
  }

  maids[index].status = status || maids[index].status;
  maids[index].busyUntil = busyUntil !== undefined ? busyUntil : maids[index].busyUntil;
  maids[index].etaMins = etaMins !== undefined ? etaMins : maids[index].etaMins;

  saveData(MAIDS_FILE, maids);
  res.json({ success: true, message: 'Status updated successfully', maid: maids[index] });
});

// 4. Update Maid Pricing / Details
app.put('/api/maids/:id/pricing', (req, res) => {
  const { hourlyRate, oneTimeVisit, monthlyEstimate } = req.body;
  const index = maids.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Maid not found' });
  }

  if (hourlyRate) maids[index].pricing.hourlyRate = Number(hourlyRate);
  if (oneTimeVisit) maids[index].pricing.oneTimeVisit = Number(oneTimeVisit);
  if (monthlyEstimate) maids[index].pricing.monthlyEstimate = Number(monthlyEstimate);

  saveData(MAIDS_FILE, maids);
  res.json({ success: true, message: 'Pricing updated successfully', maid: maids[index] });
});

// 5. Dynamic Real-Time Price Estimator Endpoint
app.post('/api/estimate-price', (req, res) => {
  const { bhk = '2', services = ['cleaning', 'cooking'], familyMembers = 3, frequency = 'monthly' } = req.body;

  let baseRate = 800; // base visit
  const bhkMultipliers = { '1': 1, '2': 1.3, '3': 1.7, '4': 2.2, 'villa': 2.8 };
  const bhkFactor = bhkMultipliers[bhk] || 1.3;

  let choresCost = 0;
  if (services.includes('cleaning')) choresCost += 900 * bhkFactor;
  if (services.includes('dishwashing')) choresCost += 600 * (1 + (familyMembers - 1) * 0.15);
  if (services.includes('cooking')) choresCost += 1400 * (1 + (familyMembers - 2) * 0.2);
  if (services.includes('babysitting')) choresCost += 2800;
  if (services.includes('elderlyCare')) choresCost += 3200;
  if (services.includes('laundry')) choresCost += 500;

  let monthlyTotal = Math.round(choresCost);
  let oneTimeVisit = Math.round(monthlyTotal / 10 + 150);
  let hourlyEstimate = Math.round(140 * bhkFactor);

  res.json({
    success: true,
    breakdown: {
      bhk,
      familyMembers,
      services,
      frequency,
      estimatedHourlyRate: hourlyEstimate,
      estimatedOneTimeVisit: oneTimeVisit,
      estimatedMonthlyTotal: monthlyTotal,
      savingsNote: frequency === 'monthly' ? 'Includes 15% long-term commitment savings!' : 'Instant emergency dispatcher rates applied'
    }
  });
});

// 6. Bookings Endpoints
app.get('/api/bookings', (req, res) => {
  res.json({ success: true, bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/bookings', (req, res) => {
  const { maidId, customerName, customerPhone, address, serviceType, frequency, scheduledTime, totalAmount, paymentMethod, notes } = req.body;

  const maid = maids.find(m => m.id === maidId);
  if (!maid) {
    return res.status(404).json({ success: false, message: 'Maid not found' });
  }

  const newBooking = {
    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    maidId,
    maidName: maid.name,
    maidAvatar: maid.avatar,
    maidPhone: maid.phone,
    customerName: customerName || 'Guest User',
    customerPhone: customerPhone || '+91 98765 00000',
    address: address || 'Current Location Address',
    serviceType: serviceType || 'General House Help',
    frequency: frequency || 'instant',
    scheduledTime: scheduledTime || 'Immediately (Within 20 mins)',
    status: 'accepted', // Auto-accepted in fast-track simulation
    totalAmount: totalAmount || maid.pricing.oneTimeVisit,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    createdAt: new Date().toISOString(),
    etaRemainingMins: maid.etaMins || 20,
    notes: notes || ''
  };

  bookings.unshift(newBooking);
  saveData(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: 'Maid booked successfully! She is preparing to head to your location.',
    booking: newBooking
  });
});

app.put('/api/bookings/:id/status', (req, res) => {
  const { status, etaRemainingMins } = req.body;
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  bookings[index].status = status;
  if (etaRemainingMins !== undefined) {
    bookings[index].etaRemainingMins = etaRemainingMins;
  }

  saveData(BOOKINGS_FILE, bookings);
  res.json({ success: true, message: `Booking status updated to ${status}`, booking: bookings[index] });
});

// 7. Call Logs & Direct Call Dispatch
app.post('/api/calls/log', (req, res) => {
  const { maidId, maidName, durationSeconds, callType = 'outgoing', status = 'connected' } = req.body;
  const callEntry = {
    id: `CALL-${Date.now()}`,
    maidId,
    maidName,
    durationSeconds: durationSeconds || 0,
    callType,
    status,
    timestamp: new Date().toISOString()
  };

  callLogs.unshift(callEntry);
  saveData(CALLS_FILE, callLogs);
  res.json({ success: true, message: 'Call logged successfully', call: callEntry });
});

app.get('/api/calls', (req, res) => {
  res.json({ success: true, callLogs });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', app: 'MaidEase Live API', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 MaidEase Live Backend running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another process.`);
    console.error(`💡 Solution:`);
    console.error(`   1. Stop the existing process using port ${PORT}, or`);
    console.error(`   2. In PowerShell run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error(`   3. Or run on another port: $env:PORT=5001; node index.js\n`);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;
