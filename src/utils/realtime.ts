import { db, COLLECTIONS, collection, doc, setDoc, onSnapshot } from '../firebase';

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
  private channelName = 'pts_live_realtime_bus_v3';
  private processedEventNonces: Set<string> = new Set();
  private isListeningFirestore = false;

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

    // Global Multi-device Firestore Cloud Signals listener
    this.setupFirestoreSignalListener();
  }

  private setupFirestoreSignalListener() {
    if (typeof window === 'undefined' || this.isListeningFirestore) return;
    try {
      this.isListeningFirestore = true;
      const signalsCol = collection(db, COLLECTIONS.CALL_SIGNALS);
      onSnapshot(
        signalsCol,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              if (data && data.type && data.nonce) {
                // Ignore events older than 60 seconds
                if (data.timestamp && Date.now() - data.timestamp > 60000) {
                  return;
                }
                const payload: RealtimeEventPayload = {
                  type: data.type as RealtimeEventType,
                  data: data.data,
                  senderId: data.senderId,
                  timestamp: data.timestamp || Date.now(),
                  nonce: data.nonce,
                };
                this.handleIncomingPayload(payload);
              }
            }
          });
        },
        (err) => {
          console.warn('Firestore call signals listener notice:', err);
        }
      );
    } catch (e) {
      console.warn('Could not setup Firestore signal listener:', e);
    }
  }

  // Subscribe to real-time events
  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Broadcast event to all devices (via Firestore), tabs, windows, and local listeners
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
    if (this.processedEventNonces.size > 500) {
      const first = Array.from(this.processedEventNonces).slice(0, 100);
      first.forEach((n) => this.processedEventNonces.delete(n));
    }

    // 1. Local BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    // 2. Storage Event trigger for iframe sync
    try {
      const storageKey = `pts_realtime_event_packet_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setTimeout(() => {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }, 2000);
    } catch {}

    // 3. Cloud Broadcast via Firestore for Call Signals & Key Events (cross-device/cross-phone sync)
    if (
      type.startsWith('VOICE_CALL_') ||
      type.startsWith('TYPING_') ||
      type === 'PAYMENT_UPDATED' ||
      type === 'ORDER_UPDATED' ||
      type === 'SLOT_AVAILABILITY_UPDATED'
    ) {
      const docId = data?.callSessionId ? `CALL-${data.callSessionId}` : `SIG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      try {
        const sigDoc = doc(db, COLLECTIONS.CALL_SIGNALS, docId);
        setDoc(
          sigDoc,
          {
            type,
            data,
            senderId,
            timestamp: Date.now(),
            nonce,
          },
          { merge: true }
        ).catch(() => {});
      } catch {}
    }

    // 4. Notify local listeners in current tab immediately
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
    if (this.processedEventNonces.size > 500) {
      const first = Array.from(this.processedEventNonces).slice(0, 100);
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
