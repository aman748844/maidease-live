import { API_BASE } from './api';

// Real-Time Event Bus using native Server-Sent Events (SSE) + Web Audio alerts
class RealtimeService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectTimeout = null;
  }

  connect() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource(`${API_BASE}/realtime/stream`);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyListeners('connection_status', { connected: true });
        console.log('⚡ MaidEase Live Real-Time Stream connected');
      };

      this.eventSource.onerror = (err) => {
        this.isConnected = false;
        this.notifyListeners('connection_status', { connected: false });
        this.eventSource?.close();
        this.eventSource = null;

        // Auto reconnect after 3 seconds
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };

      // Built-in event listeners
      const events = [
        'booking_created',
        'booking_updated',
        'maid_status_change',
        'maid_updated',
        'maid_location_update',
        'call_incoming',
        'call_logged'
      ];

      events.forEach(eventName => {
        this.eventSource.addEventListener(eventName, (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notifyListeners(eventName, data);
          } catch (e) {
            console.error(`Error parsing SSE event ${eventName}:`, e);
          }
        });
      });

    } catch (e) {
      console.error('Failed to initialize EventSource:', e);
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    // Return unbind function
    return () => {
      this.listeners.get(eventName)?.delete(callback);
    };
  }

  notifyListeners(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Listener error on ${eventName}:`, e);
        }
      });
    }
  }

  // Play pleasant, instant sound effects without external audio files
  playChime(type = 'notification') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'booking') {
        // High upbeat dual tone
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'ring') {
        // Phone ring tone pair
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // Subtle ping
        osc.frequency.setValueAtTime(784, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // AudioContext blocked or unsupported
    }
  }

  async emit(event, data) {
    try {
      await fetch(`${API_BASE}/realtime/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (e) {
      console.error('Failed to emit realtime event:', e);
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    this.eventSource?.close();
    this.eventSource = null;
    this.isConnected = false;
  }
}

export const realtime = new RealtimeService();
