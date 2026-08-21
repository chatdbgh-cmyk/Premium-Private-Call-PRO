import { ChatMessage, ServiceOrder, PaymentRequest, UserAccount } from '../types';

export type RealtimeEventType =
  | 'NEW_MESSAGE'
  | 'MESSAGE_STATUS_UPDATE'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'VOICE_CALL_OFFER'
  | 'VOICE_CALL_ANSWER'
  | 'VOICE_CALL_ICE_CANDIDATE'
  | 'VOICE_CALL_ACCEPT'
  | 'VOICE_CALL_REJECT'
  | 'VOICE_CALL_START'
  | 'VOICE_CALL_END'
  | 'VOICE_CALL_STATUS'
  | 'PAYMENT_UPDATED'
  | 'ORDER_UPDATED'
  | 'USER_UPDATED'
  | 'SLOT_AVAILABILITY_UPDATED'
  | 'CLIENT_LOCATION_UPDATE';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  data: any;
  senderId?: string;
  timestamp: number;
  nonce?: string;
}

type EventCallback = (payload: RealtimeEventPayload) => void;

class RealtimeChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventCallback> = new Set();
  private channelName = 'pts_live_realtime_bus_v2';
  private processedEventNonces: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent<RealtimeEventPayload>) => {
          if (event && event.data) {
            this.handleIncomingPayload(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel fallback:', e);
      }
    }

    // Fallback: Storage event listener for cross-window / cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('pts_realtime_event_packet_') && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.handleIncomingPayload(parsed);
          } catch {}
        }
      });
    }
  }

  // Subscribe to real-time events
  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Broadcast event to all tabs, windows, and local listeners
  broadcast(type: RealtimeEventType, data: any, senderId?: string) {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const payload: RealtimeEventPayload = {
      type,
      data,
      senderId,
      timestamp: Date.now(),
      nonce,
    };

    // Mark as processed locally to prevent self-echo loop
    this.processedEventNonces.add(nonce);
    if (this.processedEventNonces.size > 300) {
      const first = Array.from(this.processedEventNonces).slice(0, 75);
      first.forEach((n) => this.processedEventNonces.delete(n));
    }

    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 2. Storage Event trigger for cross-tab iframe sync
    try {
      const storageKey = `pts_realtime_event_packet_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setTimeout(() => {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }, 2000);
    } catch {}

    // 3. Notify local listeners in current tab immediately
    this.notifyListeners(payload);
  }

  private handleIncomingPayload(payload: RealtimeEventPayload) {
    if (!payload || !payload.nonce) {
      this.notifyListeners(payload);
      return;
    }
    if (this.processedEventNonces.has(payload.nonce)) {
      return;
    }
    this.processedEventNonces.add(payload.nonce);
    if (this.processedEventNonces.size > 300) {
      const first = Array.from(this.processedEventNonces).slice(0, 75);
      first.forEach((n) => this.processedEventNonces.delete(n));
    }
    this.notifyListeners(payload);
  }

  private notifyListeners(payload: RealtimeEventPayload) {
    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error in realtime listener:', e);
      }
    });
  }
}

export const realtimeBus = new RealtimeChannelService();
