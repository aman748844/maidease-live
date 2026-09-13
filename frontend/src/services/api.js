const API_BASE = '/api';

export const api = {
  // Fetch all maids with optional filters
  async getMaids(params = {}) {
    const query = new URLSearchParams();
    if (params.city && params.city !== 'all') query.append('city', params.city);
    if (params.service && params.service !== 'all') query.append('service', params.service);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.maxDistance) query.append('maxDistance', params.maxDistance);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);

    const res = await fetch(`${API_BASE}/maids?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch maids');
    return res.json();
  },

  // Get single maid
  async getMaid(id) {
    const res = await fetch(`${API_BASE}/maids/${id}`);
    if (!res.ok) throw new Error('Failed to fetch maid profile');
    return res.json();
  },

  // Update Maid Live Status
  async updateMaidStatus(id, statusData) {
    const res = await fetch(`${API_BASE}/maids/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Update Maid Pricing
  async updateMaidPricing(id, pricingData) {
    const res = await fetch(`${API_BASE}/maids/${id}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pricingData)
    });
    if (!res.ok) throw new Error('Failed to update pricing');
    return res.json();
  },

  // Price Estimator
  async estimatePrice(data) {
    const res = await fetch(`${API_BASE}/estimate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to calculate estimate');
    return res.json();
  },

  // Fetch Bookings
  async getBookings() {
    const res = await fetch(`${API_BASE}/bookings`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  // Create Booking
  async createBooking(bookingData) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
  },

  // Update Booking Status
  async updateBookingStatus(id, statusData) {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
  },

  // Log Call
  async logCall(callData) {
    const res = await fetch(`${API_BASE}/calls/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData)
    });
    if (!res.ok) throw new Error('Failed to log call');
    return res.json();
  },

  // Get Call Logs
  async getCallLogs() {
    const res = await fetch(`${API_BASE}/calls`);
    if (!res.ok) throw new Error('Failed to get call logs');
    return res.json();
  },

  // Dispatch Telephony Call to User Phone
  async dispatchTelephonyCall(data) {
    const res = await fetch(`${API_BASE}/telephony/dispatch-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to dispatch call to phone');
    return res.json();
  },

  // AI Agent: Match & Query
  async matchAIAgent(prompt) {
    const res = await fetch(`${API_BASE}/ai/agent-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Failed to process AI agent request');
    return res.json();
  },

  // AI Agent: Call Persona Voice Reply
  async getAICallReply(data) {
    const res = await fetch(`${API_BASE}/ai/call-voice-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to get AI call voice reply');
    return res.json();
  },

  // AI Agent: Get available AI models
  async getAIModels() {
    const res = await fetch(`${API_BASE}/ai/models`);
    if (!res.ok) throw new Error('Failed to fetch AI models');
    return res.json();
  },

  // AI Agent 3: Multimodal Vision-Language Model (VLM) Image Analyzer
  async analyzeRoomPhoto(data) {
    const res = await fetch(`${API_BASE}/ai/vision-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to analyze room photo with VLM');
    return res.json();
  },

  // AI Agent 4: Justdial-Style Instant Custom Quote
  async getInstantQuote(data) {
    const res = await fetch(`${API_BASE}/ai/instant-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to fetch instant quote');
    return res.json();
  }
};
