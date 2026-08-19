import { ChatMessage, ServiceOrder, PaymentRequest, UserAccount } from '../types';

export type RealtimeEventType =
  | 'NEW_MESSAGE'
  | 'MESSAGE_STATUS_UPDATE'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'VOICE_CALL_START'
  | 'VOICE_CALL_END'
  | 'PAYMENT_UPDATED'
  | 'ORDER_UPDATED'
  | 'USER_UPDATED';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  data: any;
  senderId?: string;
  timestamp: number;
}

type EventCallback = (payload: RealtimeEventPayload) => void;

class RealtimeChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventCallback> = new Set();
  private channelName = 'pts_live_realtime_bus_v1';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent<RealtimeEventPayload>) => {
          if (event && event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization fallback:', e);
      }
    }

    // Fallback: Storage event listener for cross-window sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'pts_realtime_storage_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed);
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

  // Broadcast event to other tabs and local listeners
  broadcast(type: RealtimeEventType, data: any, senderId?: string) {
    const payload: RealtimeEventPayload = {
      type,
      data,
      senderId,
      timestamp: Date.now(),
    };

    // 1. Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 2. Storage fallback trigger
    try {
      localStorage.setItem('pts_realtime_storage_event', JSON.stringify(payload));
    } catch {}

    // 3. Notify local listeners in same tab
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
