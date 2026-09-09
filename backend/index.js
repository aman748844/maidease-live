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

// -------------------------------------------------------------
// REAL-TIME EVENT BUS (Server-Sent Events + Live Multi-Client PubSub)
// -------------------------------------------------------------
const sseClients = new Set();

function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// SSE Connection Endpoint
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), clientCount: sseClients.size + 1 })}\n\n`);

  sseClients.add(res);

  // Keep connection alive with periodic heartbeats
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (err) {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Client Event Emission (Allows client to trigger real-time actions across all connected tabs)
app.post('/api/realtime/emit', (req, res) => {
  const { event, data } = req.body;
  if (!event) {
    return res.status(400).json({ success: false, message: 'Event name is required' });
  }
  broadcastEvent(event, data || {});
  res.json({ success: true, event });
});

// Active GPS Simulation Trackers
const activeGpsTrackers = new Map();

function startGpsSimulation(bookingId) {
  if (activeGpsTrackers.has(bookingId)) return;

  // Base coordinates around Indiranagar / Koramangala
  let startLat = 12.9716 + (Math.random() - 0.5) * 0.02;
  let startLng = 77.6412 + (Math.random() - 0.5) * 0.02;
  const targetLat = 12.9784;
  const targetLng = 77.6408;
  let remainingMins = 18;
  let progressStep = 0;

  const interval = setInterval(() => {
    progressStep += 1;
    remainingMins = Math.max(0, remainingMins - 1);

    // Lerp towards target
    const factor = Math.min(1, progressStep / 18);
    const currentLat = startLat + (targetLat - startLat) * factor;
    const currentLng = startLng + (targetLng - startLng) * factor;

    const payload = {
      bookingId,
      lat: Number(currentLat.toFixed(5)),
      lng: Number(currentLng.toFixed(5)),
      etaRemainingMins: remainingMins,
      speedKmH: remainingMins > 0 ? 24 : 0,
      status: remainingMins <= 0 ? 'arrived' : remainingMins < 5 ? 'near_gate' : 'on_the_way',
      timestamp: new Date().toISOString()
    };

    broadcastEvent('maid_location_update', payload);

    if (remainingMins <= 0) {
      clearInterval(interval);
      activeGpsTrackers.delete(bookingId);

      // Update booking status
      const bIndex = bookings.findIndex(b => b.id === bookingId);
      if (bIndex !== -1) {
        bookings[bIndex].status = 'arrived';
        bookings[bIndex].etaRemainingMins = 0;
        saveData(BOOKINGS_FILE, bookings);
        broadcastEvent('booking_updated', bookings[bIndex]);
      }
    }
  }, 4000);

  activeGpsTrackers.set(bookingId, interval);
}

// -------------------------------------------------------------
// 1. Get All Maids (with real-time filtering)
// -------------------------------------------------------------
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

// 3. Update Maid Real-Time Status
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

  // Broadcast real-time change to all connected clients
  broadcastEvent('maid_status_change', { maidId: maids[index].id, status: maids[index].status, maid: maids[index] });

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
  broadcastEvent('maid_updated', maids[index]);

  res.json({ success: true, message: 'Pricing updated successfully', maid: maids[index] });
});

// 5. Dynamic Real-Time Price Estimator Endpoint
app.post('/api/estimate-price', (req, res) => {
  const { bhk = '2', services = ['cleaning', 'cooking'], familyMembers = 3, frequency = 'monthly' } = req.body;

  let baseRate = 800;
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

// -------------------------------------------------------------
// 6. Bookings Endpoints with Real-Time Broadcasting
// -------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  res.json({ success: true, bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/bookings', (req, res) => {
  const { maidId, customerName, customerPhone, address, serviceType, frequency, scheduledTime, totalAmount, paymentMethod, notes } = req.body;

  const maid = maids.find(m => m.id === maidId);
  if (!maid) {
    return res.status(404).json({ success: false, message: 'Maid not found' });
  }

  // Generate 4-digit verification OTP
  const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const newBooking = {
    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    maidId,
    maidName: maid.name,
    maidAvatar: maid.avatar,
    maidPhone: maid.phone,
    customerName: customerName || 'Guest User',
    customerPhone: customerPhone || '+91 98765 00000',
    address: address || 'Indiranagar 100ft Road, Bengaluru',
    serviceType: serviceType || 'General House Help',
    frequency: frequency || 'instant',
    scheduledTime: scheduledTime || 'Immediately (Within 20 mins)',
    status: 'accepted',
    otp: startOtp,
    totalAmount: totalAmount || maid.pricing.oneTimeVisit,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    createdAt: new Date().toISOString(),
    etaRemainingMins: maid.etaMins || 20,
    notes: notes || '',
    coordinates: {
      maidLat: 12.9716,
      maidLng: 77.6412,
      destinationLat: 12.9784,
      destinationLng: 77.6408
    }
  };

  bookings.unshift(newBooking);
  saveData(BOOKINGS_FILE, bookings);

  // Automatically mark maid status as busy
  const mIndex = maids.findIndex(m => m.id === maidId);
  if (mIndex !== -1) {
    maids[mIndex].status = 'busy';
    saveData(MAIDS_FILE, maids);
    broadcastEvent('maid_status_change', { maidId, status: 'busy', maid: maids[mIndex] });
  }

  // Broadcast real-time booking to all partners & tabs!
  broadcastEvent('booking_created', newBooking);

  // Start live GPS dispatch simulation
  startGpsSimulation(newBooking.id);

  res.status(201).json({
    success: true,
    message: 'Maid booked successfully! Live dispatch initiated.',
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

  // If status is completed or cancelled, make maid available again
  if (status === 'completed' || status === 'cancelled') {
    const mIndex = maids.findIndex(m => m.id === bookings[index].maidId);
    if (mIndex !== -1) {
      maids[mIndex].status = 'available';
      saveData(MAIDS_FILE, maids);
      broadcastEvent('maid_status_change', { maidId: maids[mIndex].id, status: 'available', maid: maids[mIndex] });
    }
  }

  saveData(BOOKINGS_FILE, bookings);

  // Real-time broadcast
  broadcastEvent('booking_updated', bookings[index]);

  res.json({ success: true, message: `Booking status updated to ${status}`, booking: bookings[index] });
});

// -------------------------------------------------------------
// 7. Call Logs & Direct Call Dispatch
// -------------------------------------------------------------
app.post('/api/calls/log', (req, res) => {
  const { maidId, maidName, durationSeconds, callType = 'outgoing', status = 'connected', notes } = req.body;
  const callEntry = {
    id: `CALL-${Date.now()}`,
    maidId,
    maidName,
    durationSeconds: durationSeconds || 0,
    callType,
    status,
    notes: notes || 'Live simulated voice conversation',
    timestamp: new Date().toISOString()
  };

  callLogs.unshift(callEntry);
  saveData(CALLS_FILE, callLogs);

  broadcastEvent('call_logged', callEntry);

  res.json({ success: true, message: 'Call logged successfully', call: callEntry });
});

app.get('/api/calls', (req, res) => {
  res.json({ success: true, callLogs });
});

// -------------------------------------------------------------
// 8. AI AGENT & AI MODELS INTEGRATION
// -------------------------------------------------------------

// AI Agent 1: Natural Language Requirement Parser & Smart Matcher
app.post('/api/ai/agent-match', (req, res) => {
  const { prompt = '' } = req.body;
  const text = prompt.toLowerCase();

  // 1. Natural language intent entity extraction
  const detectedServices = [];
  if (text.includes('cook') || text.includes('khana') || text.includes('roti') || text.includes('dinner') || text.includes('lunch') || text.includes('nashta')) {
    detectedServices.push('Cooking');
  }
  if (text.includes('clean') || text.includes('safai') || text.includes('jhadu') || text.includes('poocha') || text.includes('mopping') || text.includes('dusting')) {
    detectedServices.push('Deep Cleaning');
  }
  if (text.includes('bartan') || text.includes('dish') || text.includes('utensil')) {
    detectedServices.push('Dishwashing');
  }
  if (text.includes('baby') || text.includes('bacha') || text.includes('child')) {
    detectedServices.push('Babysitting');
  }
  if (text.includes('elder') || text.includes('bujurg') || text.includes('old age') || text.includes('parents')) {
    detectedServices.push('Elderly Care');
  }

  // Default to General Help if none detected
  if (detectedServices.length === 0) {
    detectedServices.push('Cooking', 'Deep Cleaning');
  }

  // Detect BHK
  let bhk = 2;
  const bhkMatch = text.match(/([1-5])\s*bhk/);
  if (bhkMatch) bhk = parseInt(bhkMatch[1], 10);

  // Detect Veg/Dietary
  const isVeg = text.includes('veg') || text.includes('shakahari') || text.includes('pure veg');

  // Detect Budget
  const budgetMatch = text.match(/(?:under|budget|below|₹|rs\.?)\s*(\d{3,5})/);
  const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 600;

  // 2. AI Multi-Factor Scoring Algorithm across maids
  const scoredMaids = maids.map(m => {
    let score = 50;

    // Service match (up to 30 points)
    const matchingServices = m.services.filter(s => detectedServices.some(ds => s.toLowerCase().includes(ds.toLowerCase())));
    score += matchingServices.length * 15;

    // Rating boost (up to 15 points)
    score += (m.rating - 4.0) * 15;

    // Proximity boost (up to 10 points)
    if (m.distanceKm <= 2.0) score += 10;
    else if (m.distanceKm <= 3.5) score += 5;

    // Verification boost
    if (m.verified.police && m.verified.aadhaar) score += 5;

    // Availability boost
    if (m.status === 'available') score += 10;

    // Specialty matching
    if (isVeg && m.specialties.some(sp => sp.toLowerCase().includes('veg'))) score += 8;

    const matchPercent = Math.min(99, Math.max(75, Math.round(score)));

    return {
      maid: m,
      matchPercent,
      matchingServices,
      reasons: [
        `Proximity: Only ${m.distanceKm} km away (${m.etaMins} mins ETA)`,
        `Rating: ${m.rating}★ with ${m.reviewCount}+ verified reviews`,
        `Specialty: ${m.specialties.slice(0, 2).join(', ')}`,
        `Trust: 100% Police & Aadhaar Verified`
      ]
    };
  });

  scoredMaids.sort((a, b) => b.matchPercent - a.matchPercent);
  const topRecommendations = scoredMaids.slice(0, 3);

  // Natural Language AI Reasoning Response
  const aiReasoning = `Based on your request for ${detectedServices.join(' & ')} (${bhk} BHK), I matched ${topRecommendations[0]?.maid.name} as your best fit with a ${topRecommendations[0]?.matchPercent}% compatibility score. She is currently ${topRecommendations[0]?.maid.status === 'available' ? 'Available now' : 'Near your sector'} with an estimated ${topRecommendations[0]?.maid.etaMins}-min arrival.`;

  res.json({
    success: true,
    queryAnalysis: {
      detectedServices,
      bhk,
      isVeg,
      maxBudget
    },
    topMatch: topRecommendations[0] || null,
    recommendations: topRecommendations,
    aiReasoning,
    suggestedChecklist: [
      `Pre-arrival kitchen surface sanitization`,
      `Meal preparation according to your taste (less oil/spices)`,
      `Utensil scrubbing & dry rack placement`,
      `Floor sweeping & wet mopping in ${bhk} BHK`
    ]
  });
});

// AI Agent 2: Interactive Real-Time Voice Call Dialogue Generator (Speech Persona)
app.post('/api/ai/call-voice-reply', (req, res) => {
  const { userMessage = '', maidId, maidName = 'Sunita Devi' } = req.body;
  const msg = userMessage.toLowerCase().trim();

  const maid = maids.find(m => m.id === maidId) || {
    name: maidName,
    location: 'Sector 45, Near Cyber Hub',
    pricing: { oneTimeVisit: 349, hourlyRate: 180 },
    etaMins: 20
  };

  let reply = '';
  let actionSuggestion = null;

  if (!msg || msg.includes('hello') || msg.includes('namaste') || msg.includes('sunita') || msg.includes('rekha') || msg.includes('kavita') || msg.includes('priya') || msg.includes('kaise ho')) {
    reply = `Namaste ji! Main ${maid.name} bol rahi hu. Aapko khana banane ya ghar ki safai me kya help chahiye?`;
    actionSuggestion = 'greet';
  } else if (msg.includes('available') || msg.includes('aa sakti') || msg.includes('aoge') || msg.includes('time') || msg.includes('kab') || msg.includes('jaldi')) {
    reply = `Ji haan bhaiya, main abhi ${maid.location} ke paas hi hu. Agar aap abhi book karenge to main 15 se 20 minute me aapke ghar pahunch jaungi.`;
    actionSuggestion = 'check_availability';
  } else if (msg.includes('price') || msg.includes('kitna') || msg.includes('rate') || msg.includes('charge') || msg.includes('rupaye') || msg.includes('paisa') || msg.includes('cost')) {
    reply = `Ek bar ke regular visit ka ₹${maid.pricing.oneTimeVisit} charge hota hai. Isme khana banana aur bartan/kitchen safai dono complete ho jata hai.`;
    actionSuggestion = 'quote_price';
  } else if (msg.includes('khana') || msg.includes('cook') || msg.includes('sabji') || msg.includes('roti') || msg.includes('paneer') || msg.includes('dal') || msg.includes('veg') || msg.includes('non veg')) {
    reply = `Ji bilkul! Main North Indian, South Indian, gol phulka rotis, daal tadka, veg aur non-veg sab acche aur hygienic tarike se bana leti hu. Aap jo bologe wahi bana dungi.`;
    actionSuggestion = 'cook_details';
  } else if (msg.includes('safai') || msg.includes('clean') || msg.includes('jhadu') || msg.includes('poocha') || msg.includes('deep cleaning') || msg.includes('dusting')) {
    reply = `Safai me rooms ki sweeping, wet mopping, dusting aur bathroom/kitchen cleaning pura neat and clean kar dungi.`;
    actionSuggestion = 'cleaning_details';
  } else if (msg.includes('aajao') || msg.includes('niklo') || msg.includes('confirm') || msg.includes('book') || msg.includes('turant') || msg.includes('theek hai') || msg.includes('ha')) {
    reply = `Achha ji! Main apna kit pack karke turant nikal rahi hu. Aap please app par 'Confirm Booking' daba dijiye taaki mujhe aapka exact flat number aur OTP mil jaye. Shukriya!`;
    actionSuggestion = 'confirm_booking';
  } else {
    reply = `Ji bilkul, main samajh gayi. Main ${maid.location} se turant nikalne ke liye ready hu. Aapka kam bilkul badhiya aur tasalli se hoga!`;
    actionSuggestion = 'general';
  }

  res.json({
    success: true,
    maidName: maid.name,
    spokenReply: reply,
    actionSuggestion,
    timestamp: new Date().toISOString()
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    app: 'MaidEase Live Real-Time & AI API',
    connectedClients: sseClients.size,
    activeGpsRides: activeGpsTrackers.size,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 MaidEase Live Backend running at http://localhost:${PORT}`);
  console.log(`⚡ Real-Time SSE Stream active at http://localhost:${PORT}/api/realtime/stream`);
  console.log(`🤖 AI Agent endpoints active at http://localhost:${PORT}/api/ai/agent-match`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;
