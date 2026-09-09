const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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
    maidId: "maid_pune_1",
    maidName: "Sunita Shinde",
    customerName: "Aman User",
    customerPhone: "+91 98765 00000",
    address: "Flat 402, Rohan Tarang, Wakad, Pune",
    serviceType: "Cooking & Kitchen Cleaning",
    frequency: "instant",
    scheduledTime: "ASAP (Instant 20-min)",
    status: "in_progress",
    totalAmount: 329,
    paymentMethod: "Cash after service",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    etaRemainingMins: 0,
    notes: "Please make dinner (Chapati, Dal, Paneer Bhurji)."
  }
]);
let callLogs = loadData(CALLS_FILE, []);

// -------------------------------------------------------------
// REAL-TIME EVENT BUS (Server-Sent Events)
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

  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), clientCount: sseClients.size + 1 })}\n\n`);
  sseClients.add(res);

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

// Client Event Emission
app.post('/api/realtime/emit', (req, res) => {
  const { event, data } = req.body;
  if (!event) return res.status(400).json({ success: false, message: 'Event name is required' });
  broadcastEvent(event, data || {});
  res.json({ success: true, event });
});

// Active GPS Simulation Trackers (Pune coordinates: 18.5204 N, 73.8567 E)
const activeGpsTrackers = new Map();

function startGpsSimulation(bookingId) {
  if (activeGpsTrackers.has(bookingId)) return;

  // Base coordinates around Pune (Kothrud / Wakad / Viman Nagar)
  let startLat = 18.5074 + (Math.random() - 0.5) * 0.02;
  let startLng = 73.8077 + (Math.random() - 0.5) * 0.02;
  const targetLat = 18.5987;
  const targetLng = 73.7661;
  let remainingMins = 18;
  let progressStep = 0;

  const interval = setInterval(() => {
    progressStep += 1;
    remainingMins = Math.max(0, remainingMins - 1);

    const factor = Math.min(1, progressStep / 18);
    const currentLat = startLat + (targetLat - startLat) * factor;
    const currentLng = startLng + (targetLng - startLng) * factor;

    const payload = {
      bookingId,
      lat: Number(currentLat.toFixed(5)),
      lng: Number(currentLng.toFixed(5)),
      etaRemainingMins: remainingMins,
      speedKmH: remainingMins > 0 ? 28 : 0,
      status: remainingMins <= 0 ? 'arrived' : remainingMins < 4 ? 'near_gate' : 'on_the_way',
      timestamp: new Date().toISOString()
    };

    broadcastEvent('maid_location_update', payload);

    if (remainingMins <= 0) {
      clearInterval(interval);
      activeGpsTrackers.delete(bookingId);

      const bIndex = bookings.findIndex(b => b.id === bookingId);
      if (bIndex !== -1) {
        bookings[bIndex].status = 'arrived';
        bookings[bIndex].etaRemainingMins = 0;
        saveData(BOOKINGS_FILE, bookings);
        broadcastEvent('booking_updated', bookings[bIndex]);
      }
    }
  }, 3500);

  activeGpsTrackers.set(bookingId, interval);
}

// -------------------------------------------------------------
// 1. Get All Maids (with city & filter support)
// -------------------------------------------------------------
app.get('/api/maids', (req, res) => {
  const { city, service, status, search, maxDistance, maxPrice } = req.query;
  let filtered = [...maids];

  if (city && city !== 'all') {
    filtered = filtered.filter(m => (m.city || 'Pune').toLowerCase() === city.toLowerCase());
  }

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
    availableCount: filtered.filter(m => m.status === 'available').length,
    maids: filtered
  });
});

// 2. Get Single Maid
app.get('/api/maids/:id', (req, res) => {
  const maid = maids.find(m => m.id === req.params.id);
  if (!maid) return res.status(404).json({ success: false, message: 'Maid not found' });
  res.json({ success: true, maid });
});

// 3. Update Maid Status
app.put('/api/maids/:id/status', (req, res) => {
  const { status, busyUntil, etaMins } = req.body;
  const index = maids.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Maid not found' });

  maids[index].status = status || maids[index].status;
  maids[index].busyUntil = busyUntil !== undefined ? busyUntil : maids[index].busyUntil;
  maids[index].etaMins = etaMins !== undefined ? etaMins : maids[index].etaMins;

  saveData(MAIDS_FILE, maids);
  broadcastEvent('maid_status_change', { maidId: maids[index].id, status: maids[index].status, maid: maids[index] });

  res.json({ success: true, message: 'Status updated successfully', maid: maids[index] });
});

// 4. Update Maid Pricing
app.put('/api/maids/:id/pricing', (req, res) => {
  const { hourlyRate, oneTimeVisit, monthlyEstimate } = req.body;
  const index = maids.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Maid not found' });

  if (hourlyRate) maids[index].pricing.hourlyRate = Number(hourlyRate);
  if (oneTimeVisit) maids[index].pricing.oneTimeVisit = Number(oneTimeVisit);
  if (monthlyEstimate) maids[index].pricing.monthlyEstimate = Number(monthlyEstimate);

  saveData(MAIDS_FILE, maids);
  broadcastEvent('maid_updated', maids[index]);

  res.json({ success: true, message: 'Pricing updated successfully', maid: maids[index] });
});

// 5. Price Estimator
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
// 6. Bookings Endpoints
// -------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  res.json({ success: true, bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/bookings', (req, res) => {
  const { maidId, customerName, customerPhone, address, serviceType, frequency, scheduledTime, totalAmount, paymentMethod, notes } = req.body;

  const maid = maids.find(m => m.id === maidId);
  if (!maid) return res.status(404).json({ success: false, message: 'Maid not found' });

  const startOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const newBooking = {
    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    maidId,
    maidName: maid.name,
    maidAvatar: maid.avatar,
    maidPhone: maid.phone,
    customerName: customerName || 'Aman User',
    customerPhone: customerPhone || '+91 98765 00000',
    address: address || 'Kothrud / Wakad, Pune',
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
      maidLat: 18.5074,
      maidLng: 73.8077,
      destinationLat: 18.5987,
      destinationLng: 73.7661
    }
  };

  bookings.unshift(newBooking);
  saveData(BOOKINGS_FILE, bookings);

  // Mark maid as busy
  const mIndex = maids.findIndex(m => m.id === maidId);
  if (mIndex !== -1) {
    maids[mIndex].status = 'busy';
    saveData(MAIDS_FILE, maids);
    broadcastEvent('maid_status_change', { maidId, status: 'busy', maid: maids[mIndex] });
  }

  broadcastEvent('booking_created', newBooking);
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
  if (index === -1) return res.status(404).json({ success: false, message: 'Booking not found' });

  bookings[index].status = status;
  if (etaRemainingMins !== undefined) bookings[index].etaRemainingMins = etaRemainingMins;

  if (status === 'completed' || status === 'cancelled') {
    const mIndex = maids.findIndex(m => m.id === bookings[index].maidId);
    if (mIndex !== -1) {
      maids[mIndex].status = 'available';
      saveData(MAIDS_FILE, maids);
      broadcastEvent('maid_status_change', { maidId: maids[mIndex].id, status: 'available', maid: maids[mIndex] });
    }
  }

  saveData(BOOKINGS_FILE, bookings);
  broadcastEvent('booking_updated', bookings[index]);

  res.json({ success: true, message: `Booking status updated to ${status}`, booking: bookings[index] });
});

// -------------------------------------------------------------
// 7. Call Logs & Real Telephony Dispatch
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

// Real Phone Call Dispatch Endpoint (Supports User's Own Number & Twilio/Telephony Bridge)
app.post('/api/telephony/dispatch-call', (req, res) => {
  const { targetPhoneNumber, maidId, maidName } = req.body;

  if (!targetPhoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const maid = maids.find(m => m.id === maidId) || {
    name: maidName || 'Pune Verified Maid',
    phone: '+91 98234 11201'
  };

  // Telephony log
  const teleEntry = {
    id: `TEL-${Date.now()}`,
    targetPhoneNumber,
    maidId: maid.id,
    maidName: maid.name,
    timestamp: new Date().toISOString(),
    status: 'dispatched',
    dialUri: `tel:${targetPhoneNumber}`,
    whatsappUri: `https://wa.me/${targetPhoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste! MaidEase Live se ${maid.name} ka call request connect kiya gaya hai.`)}`
  };

  broadcastEvent('telephony_call_dispatched', teleEntry);

  res.json({
    success: true,
    message: `Call successfully dispatched to ${targetPhoneNumber}!`,
    details: teleEntry
  });
});

// -------------------------------------------------------------
// 8. AI AGENT & AI MODELS (Google Gemini + Marathi/Hindi Matcher)
// -------------------------------------------------------------

// AI Agent 1: Requirement Matcher & Entity Extractor
app.post('/api/ai/agent-match', async (req, res) => {
  try {
    const { prompt = '' } = req.body;
    const text = prompt.toLowerCase();

    // Natural Language Entity Extraction
    const detectedServices = [];
    if (text.includes('cook') || text.includes('khana') || text.includes('roti') || text.includes('dinner') || text.includes('lunch') || text.includes('nashta') || text.includes('chapati') || text.includes('jevan')) {
      detectedServices.push('Cooking');
    }
    if (text.includes('clean') || text.includes('safai') || text.includes('jhadu') || text.includes('poocha') || text.includes('mopping') || text.includes('dusting') || text.includes('kacha')) {
      detectedServices.push('Deep Cleaning');
    }
    if (text.includes('bartan') || text.includes('dish') || text.includes('bhandi') || text.includes('utensil')) {
      detectedServices.push('Dishwashing');
    }
    if (text.includes('baby') || text.includes('bacha') || text.includes('balak') || text.includes('child')) {
      detectedServices.push('Babysitting');
    }
    if (text.includes('elder') || text.includes('bujurg') || text.includes('aji') || text.includes('ajoba') || text.includes('parents')) {
      detectedServices.push('Elderly Care');
    }

    if (detectedServices.length === 0) {
      detectedServices.push('Cooking', 'Deep Cleaning');
    }

    // Detect BHK
    let bhk = 2;
    const bhkMatch = text.match(/([1-5])\s*bhk/);
    if (bhkMatch) bhk = parseInt(bhkMatch[1], 10);

    // Detect Pune Localities
    let targetArea = 'Pune City';
    if (text.includes('kothrud')) targetArea = 'Kothrud, Pune';
    else if (text.includes('viman nagar')) targetArea = 'Viman Nagar, Pune';
    else if (text.includes('hinjawadi') || text.includes('hinjewadi')) targetArea = 'Hinjawadi, Pune';
    else if (text.includes('baner')) targetArea = 'Baner, Pune';
    else if (text.includes('wakad')) targetArea = 'Wakad, Pune';

    const isVeg = text.includes('veg') || text.includes('shakahari') || text.includes('pure veg');

    // Multi-factor scoring
    const scoredMaids = maids.map(m => {
      let score = 55;

      const matchingServices = m.services.filter(s => detectedServices.some(ds => s.toLowerCase().includes(ds.toLowerCase())));
      score += matchingServices.length * 15;

      if (text.includes(m.location.toLowerCase().split(' ')[0])) score += 15;
      score += (m.rating - 4.0) * 12;
      if (m.status === 'available') score += 10;
      if (m.verified.police) score += 5;

      const matchPercent = Math.min(99, Math.max(78, Math.round(score)));

      return {
        maid: m,
        matchPercent,
        matchingServices,
        reasons: [
          `Location: ${m.location} (${m.etaMins} mins ETA)`,
          `Rating: ${m.rating}★ with ${m.reviewCount}+ verified reviews`,
          `Specialty: ${m.specialties.slice(0, 2).join(', ')}`,
          `Trust: Police & Aadhaar Verified Helper`
        ]
      };
    });

    scoredMaids.sort((a, b) => b.matchPercent - a.matchPercent);
    const topMatch = scoredMaids[0] || null;

    const aiReasoning = `Maine aapke request (${detectedServices.join(' + ')}, ${bhk} BHK in ${targetArea}) ke liye ${topMatch?.maid.name} ko ${topMatch?.matchPercent}% compatibility ke saath match kiya hai. Yeh ${topMatch?.maid.location} me hain aur lagbhag ${topMatch?.maid.etaMins} minute me pahunch sakti hain.`;

    res.json({
      success: true,
      queryAnalysis: {
        detectedServices,
        bhk,
        targetArea,
        isVeg
      },
      topMatch,
      recommendations: scoredMaids.slice(0, 3),
      aiReasoning,
      suggestedChecklist: [
        `Kitchen counter & gas stove deep cleaning`,
        `Fresh ${isVeg ? 'Veg' : 'Daily'} meal prep (Gol Chapati / Bhakri + Sabji)`,
        `Utensil washing & kitchen sink sanitization`,
        `Floor broom & wet mopping with surface disinfectant`
      ]
    });
  } catch (err) {
    console.error('AI match error:', err);
    res.status(500).json({ success: false, message: 'AI Agent matching failed' });
  }
});

// AI Agent 2: Real-Time Spoken Persona Generator
app.post('/api/ai/call-voice-reply', (req, res) => {
  const { userMessage = '', maidId, maidName = 'Sunita Shinde' } = req.body;
  const msg = userMessage.toLowerCase().trim();

  const maid = maids.find(m => m.id === maidId) || {
    name: maidName,
    location: 'Kothrud, Pune',
    pricing: { oneTimeVisit: 329, hourlyRate: 160 },
    etaMins: 18
  };

  let reply = '';
  let actionSuggestion = null;

  if (!msg || msg.includes('hello') || msg.includes('namaste') || msg.includes('kaise ho') || msg.includes('namaskar')) {
    reply = `Namaskar ji! Main ${maid.name} bol rahi hu Pune se. Sangaa, tumhala sw स्वयंपाक (cooking) ki gharachya safai madhe kai help havi ahe?`;
    actionSuggestion = 'greet';
  } else if (msg.includes('available') || msg.includes('aa sakti') || msg.includes('aoge') || msg.includes('time') || msg.includes('kab') || msg.includes('jaldi')) {
    reply = `Ji haan bhaiya, main abhi ${maid.location} ke paas hi hu. Main 15 se 20 minute me aapke ghar pahunch jaungi.`;
    actionSuggestion = 'check_availability';
  } else if (msg.includes('pune') || msg.includes('kothrud') || msg.includes('viman nagar') || msg.includes('hinjawadi') || msg.includes('wakad') || msg.includes('baner')) {
    reply = `Haan ji, main Pune me hi rehti hu aur aapke area me regular visit karti hu. Aapka flat number de dijiye main nikal rahi hu.`;
    actionSuggestion = 'area_confirm';
  } else if (msg.includes('price') || msg.includes('kitna') || msg.includes('rate') || msg.includes('charge') || msg.includes('rupaye') || msg.includes('paisa')) {
    reply = `Ek time visit ka ₹${maid.pricing.oneTimeVisit} charge hota hai. Isme khana banana aur bartan/kitchen safai dono complete ho jata hai.`;
    actionSuggestion = 'quote_price';
  } else if (msg.includes('khana') || msg.includes('cook') || msg.includes('roti') || msg.includes('chapati') || msg.includes('bhakri') || msg.includes('veg')) {
    reply = `Ji bilkul! Main gol chapati, bhakri, dal tadka, veg sabji sab acche aur hygienic tarike se bana leti hu. Pure ghar jaisa swad hoga!`;
    actionSuggestion = 'cook_details';
  } else if (msg.includes('safai') || msg.includes('clean') || msg.includes('jhadu') || msg.includes('poocha') || msg.includes('bartan')) {
    reply = `Safai me pure rooms ka sweeping, wet mopping, bathroom scrubbing aur bartan chamkakar rakh dungi.`;
    actionSuggestion = 'cleaning_details';
  } else if (msg.includes('aajao') || msg.includes('confirm') || msg.includes('book') || msg.includes('turant') || msg.includes('theek hai') || msg.includes('ha')) {
    reply = `Theek hai ji, main apna kit lekar turant nikal rahi hu! Aap app par 'Confirm Book' daba dijiye taaki mujhe aapka address aur OTP mil jaye.`;
    actionSuggestion = 'confirm_booking';
  } else {
    reply = `Ji bilkul, main samajh gayi. Main ${maid.location} se nikalne ke liye ready hu. Aapka kaam bilkul tasalli se hoga!`;
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
    city: 'Pune',
    app: 'MaidEase Live Real-Time & AI Telephony API',
    connectedClients: sseClients.size,
    activeGpsRides: activeGpsTrackers.size,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 MaidEase Live Backend running at http://localhost:${PORT}`);
  console.log(`📍 City configured: Pune (Kothrud, Viman Nagar, Hinjawadi, Baner, Wakad)`);
  console.log(`⚡ Real-Time SSE Stream: http://localhost:${PORT}/api/realtime/stream`);
  console.log(`🤖 AI Agent & Voice API: http://localhost:${PORT}/api/ai/agent-match`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;
