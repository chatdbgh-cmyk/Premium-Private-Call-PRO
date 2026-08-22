import {
  db,
  COLLECTIONS,
  CONFIG_DOCS,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from '../firebase';
import {
  UserAccount,
  Developer,
  ChatMessage,
  PaymentRequest,
  SellerWithdrawRequest,
  ServiceOrder,
  PaymentSettings,
  SiteConfig,
  BotAutoReply,
  RechargePackage,
  FirebaseAccessRequest,
} from '../types';
import {
  INITIAL_DEVELOPERS,
  INITIAL_SETTINGS,
  INITIAL_SITE_CONFIG,
  INITIAL_USERS,
  INITIAL_BOT_REPLIES,
  INITIAL_WITHDRAW_REQUESTS,
  RECHARGE_PACKAGES,
} from '../data/initialData';
import { realtimeBus } from './realtime';

export interface DatabaseBackupRecord {
  id: string;
  createdAt: string;
  timestamp: number;
  note?: string;
  creatorName?: string;
  counts: {
    users: number;
    developers: number;
    messages: number;
    payments: number;
    orders: number;
    withdraws: number;
  };
  data?: {
    users: UserAccount[];
    developers: Developer[];
    messages: ChatMessage[];
    payments: PaymentRequest[];
    orders: ServiceOrder[];
    withdraws: SellerWithdrawRequest[];
    siteConfig: SiteConfig;
    paymentSettings: PaymentSettings;
    botReplies: BotAutoReply[];
    rechargePackages: RechargePackage[];
  };
}

class FirebaseSyncService {
  private isInitialized = false;
  private isSeeding = false;

  /**
   * Initialize all real-time Firestore listeners and auto-seed initial data if collections are empty.
   */
  init(callbacks: {
    onUsersChange?: (users: UserAccount[]) => void;
    onDevelopersChange?: (devs: Developer[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    onPaymentsChange?: (payments: PaymentRequest[]) => void;
    onOrdersChange?: (orders: ServiceOrder[]) => void;
    onWithdrawsChange?: (withdraws: SellerWithdrawRequest[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onPaymentSettingsChange?: (settings: PaymentSettings) => void;
    onBotRepliesChange?: (replies: BotAutoReply[]) => void;
    onRechargePackagesChange?: (packages: RechargePackage[]) => void;
    onAccessRequestsChange?: (requests: FirebaseAccessRequest[]) => void;
  }): () => void {
    if (this.isInitialized) {
      console.log('FirebaseSyncService already initialized');
    }
    this.isInitialized = true;

    const unsubs: (() => void)[] = [];

    // 1. Listen to Users
    try {
      const usersCol = collection(db, COLLECTIONS.USERS);
      const unsubUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialUsers();
          } else {
            const list: UserAccount[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as UserAccount;
              list.push({ ...data, id: docSnap.id });
            });
            if (callbacks.onUsersChange && list.length > 0) {
              callbacks.onUsersChange(list);
            }
          }
        },
        (error) => {
          console.warn('Users onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubUsers);
    } catch (e) {
      console.warn('Error setting up users listener:', e);
    }

    // 2. Listen to Developers
    try {
      const devsCol = collection(db, COLLECTIONS.DEVELOPERS);
      const unsubDevs = onSnapshot(
        devsCol,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialDevelopers();
          } else {
            const list: Developer[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Developer;
              const numId = Number(docSnap.id) || data.id;
              list.push({ ...data, id: numId });
            });
            // Sort by id
            list.sort((a, b) => a.id - b.id);
            if (callbacks.onDevelopersChange && list.length > 0) {
              callbacks.onDevelopersChange(list);
            }
          }
        },
        (error) => {
          console.warn('Developers onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubDevs);
    } catch (e) {
      console.warn('Error setting up developers listener:', e);
    }

    // 3. Listen to Chat Messages (Live Realtime cross-device)
    try {
      const messagesCol = collection(db, COLLECTIONS.CHAT_MESSAGES);
      const q = query(messagesCol, orderBy('createdAt', 'asc'), limit(500));
      const unsubMessages = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialMessages();
          } else {
            const list: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as ChatMessage;
              list.push({ ...data, id: docSnap.id });
            });
            if (callbacks.onMessagesChange) {
              callbacks.onMessagesChange(list);
            }
          }
        },
        (error) => {
          console.warn('Messages onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubMessages);
    } catch (e) {
      console.warn('Error setting up messages listener:', e);
    }

    // 4. Listen to Payment Requests
    try {
      const paymentsCol = collection(db, COLLECTIONS.PAYMENT_REQUESTS);
      const unsubPayments = onSnapshot(
        paymentsCol,
        (snapshot) => {
          const list: PaymentRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PaymentRequest;
            list.push({ ...data, id: docSnap.id });
          });
          if (callbacks.onPaymentsChange) {
            callbacks.onPaymentsChange(list);
          }
        },
        (error) => {
          console.warn('Payments onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubPayments);
    } catch (e) {
      console.warn('Error setting up payments listener:', e);
    }

    // 5. Listen to Service Orders
    try {
      const ordersCol = collection(db, COLLECTIONS.ORDERS);
      const unsubOrders = onSnapshot(
        ordersCol,
        (snapshot) => {
          const list: ServiceOrder[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ServiceOrder;
            list.push({ ...data, id: docSnap.id });
          });
          if (callbacks.onOrdersChange) {
            callbacks.onOrdersChange(list);
          }
        },
        (error) => {
          console.warn('Orders onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubOrders);
    } catch (e) {
      console.warn('Error setting up orders listener:', e);
    }

    // 6. Listen to Withdraw Requests
    try {
      const withdrawsCol = collection(db, COLLECTIONS.WITHDRAW_REQUESTS);
      const unsubWithdraws = onSnapshot(
        withdrawsCol,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialWithdraws();
          } else {
            const list: SellerWithdrawRequest[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as SellerWithdrawRequest;
              list.push({ ...data, id: docSnap.id });
            });
            if (callbacks.onWithdrawsChange) {
              callbacks.onWithdrawsChange(list);
            }
          }
        },
        (error) => {
          console.warn('Withdraws onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubWithdraws);
    } catch (e) {
      console.warn('Error setting up withdraws listener:', e);
    }

    // 7. Listen to Site Config
    try {
      const siteConfigDoc = doc(db, COLLECTIONS.SYSTEM_CONFIG, CONFIG_DOCS.SITE_CONFIG);
      const unsubConfig = onSnapshot(
        siteConfigDoc,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as SiteConfig;
            if (callbacks.onSiteConfigChange) {
              callbacks.onSiteConfigChange(data);
            }
          } else if (!this.isSeeding) {
            this.saveSiteConfig(INITIAL_SITE_CONFIG);
          }
        },
        (error) => {
          console.warn('Site config onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubConfig);
    } catch (e) {
      console.warn('Error setting up site config listener:', e);
    }

    // 8. Listen to Payment Settings
    try {
      const paySettingsDoc = doc(db, COLLECTIONS.SYSTEM_CONFIG, CONFIG_DOCS.PAYMENT_SETTINGS);
      const unsubPaySettings = onSnapshot(
        paySettingsDoc,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as PaymentSettings;
            if (callbacks.onPaymentSettingsChange) {
              callbacks.onPaymentSettingsChange(data);
            }
          } else if (!this.isSeeding) {
            this.savePaymentSettings(INITIAL_SETTINGS);
          }
        },
        (error) => {
          console.warn('Payment settings onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubPaySettings);
    } catch (e) {
      console.warn('Error setting up payment settings listener:', e);
    }

    // 9. Listen to Bot Replies
    try {
      const botCol = collection(db, COLLECTIONS.BOT_REPLIES);
      const unsubBot = onSnapshot(
        botCol,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialBotReplies();
          } else {
            const list: BotAutoReply[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as BotAutoReply;
              list.push({ ...data, id: docSnap.id });
            });
            if (callbacks.onBotRepliesChange && list.length > 0) {
              callbacks.onBotRepliesChange(list);
            }
          }
        },
        (error) => {
          console.warn('Bot replies onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubBot);
    } catch (e) {
      console.warn('Error setting up bot replies listener:', e);
    }

    // 10. Listen to Recharge Packages
    try {
      const pkgCol = collection(db, COLLECTIONS.RECHARGE_PACKAGES);
      const unsubPkg = onSnapshot(
        pkgCol,
        (snapshot) => {
          if (snapshot.empty && !this.isSeeding) {
            this.seedInitialPackages();
          } else {
            const list: RechargePackage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as RechargePackage;
              list.push({ ...data, id: docSnap.id });
            });
            if (callbacks.onRechargePackagesChange && list.length > 0) {
              callbacks.onRechargePackagesChange(list);
            }
          }
        },
        (error) => {
          console.warn('Recharge packages onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubPkg);
    } catch (e) {
      console.warn('Error setting up packages listener:', e);
    }

    // 11. Listen to Firebase Access Requests
    try {
      const reqCol = collection(db, COLLECTIONS.ACCESS_REQUESTS);
      const unsubReqs = onSnapshot(
        reqCol,
        (snapshot) => {
          const list: FirebaseAccessRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FirebaseAccessRequest;
            list.push({ ...data, id: docSnap.id });
          });
          // Sort by requestedAt
          list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
          if (callbacks.onAccessRequestsChange) {
            callbacks.onAccessRequestsChange(list);
          }
        },
        (error) => {
          console.warn('Access requests onSnapshot notice:', error);
        }
      );
      unsubs.push(unsubReqs);
    } catch (e) {
      console.warn('Error setting up access requests listener:', e);
    }

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }

  // --- Seeding Helpers (Safe & Idempotent) ---
  private async seedInitialUsers() {
    this.isSeeding = true;
    try {
      const batch = writeBatch(db);
      for (const u of INITIAL_USERS) {
        const uDoc = doc(db, COLLECTIONS.USERS, u.id);
        batch.set(uDoc, u);
      }
      await batch.commit();
      console.log('Seeded initial users to Firestore');
    } catch (e) {
      console.warn('Error seeding users:', e);
    } finally {
      this.isSeeding = false;
    }
  }

  private async seedInitialDevelopers() {
    this.isSeeding = true;
    try {
      const batch = writeBatch(db);
      for (const d of INITIAL_DEVELOPERS) {
        const dDoc = doc(db, COLLECTIONS.DEVELOPERS, d.id.toString());
        batch.set(dDoc, d);
      }
      await batch.commit();
      console.log('Seeded initial developers to Firestore');
    } catch (e) {
      console.warn('Error seeding developers:', e);
    } finally {
      this.isSeeding = false;
    }
  }

  private async seedInitialMessages() {
    try {
      const welcomeMsg: ChatMessage = {
        id: 'welcome-1',
        sender: 'bot',
        text: '👋 হ্যালো! আমাদের প্রাইভেট চ্যাট ও সার্ভিস প্ল্যাটফর্মে আপনাকে স্বাগতম। আপনি এখান থেকে সেরা ডেভেলপার ও হোস্টদের সাথে সরাসরি কথা বলে ডায়মন্ডের মাধ্যমে যেকোনো সার্ভিস নিতে পারবেন।',
        timestamp: 'এখন',
        createdAt: Date.now(),
      };
      await setDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, welcomeMsg.id), welcomeMsg);
    } catch (e) {
      console.warn('Error seeding message:', e);
    }
  }

  private async seedInitialWithdraws() {
    try {
      const batch = writeBatch(db);
      for (const w of INITIAL_WITHDRAW_REQUESTS) {
        batch.set(doc(db, COLLECTIONS.WITHDRAW_REQUESTS, w.id), w);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error seeding withdraws:', e);
    }
  }

  private async seedInitialBotReplies() {
    try {
      const batch = writeBatch(db);
      for (const r of INITIAL_BOT_REPLIES) {
        batch.set(doc(db, COLLECTIONS.BOT_REPLIES, r.id), r);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error seeding bot replies:', e);
    }
  }

  private async seedInitialPackages() {
    try {
      const batch = writeBatch(db);
      for (const p of RECHARGE_PACKAGES) {
        batch.set(doc(db, COLLECTIONS.RECHARGE_PACKAGES, p.id), p);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Error seeding packages:', e);
    }
  }

  // --- Realtime Firestore CRUD APIs ---

  // Save/Update User
  async saveUser(user: UserAccount): Promise<void> {
    try {
      const uDoc = doc(db, COLLECTIONS.USERS, user.id);
      await setDoc(uDoc, user, { merge: true });
    } catch (e) {
      console.warn('Firestore saveUser error:', e);
    }
  }

  // Batch Save/Update Users
  async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const u of users) {
        const uDoc = doc(db, COLLECTIONS.USERS, u.id);
        batch.set(uDoc, u, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore saveUsers error:', e);
    }
  }

  // Delete User
  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (e) {
      console.warn('Firestore deleteUser error:', e);
    }
  }

  // Save/Update Developer
  async saveDeveloper(developer: Developer): Promise<void> {
    try {
      const dDoc = doc(db, COLLECTIONS.DEVELOPERS, developer.id.toString());
      await setDoc(dDoc, developer, { merge: true });
    } catch (e) {
      console.warn('Firestore saveDeveloper error:', e);
    }
  }

  // Save all Developers
  async saveDevelopers(developers: Developer[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const d of developers) {
        const dDoc = doc(db, COLLECTIONS.DEVELOPERS, d.id.toString());
        batch.set(dDoc, d, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore saveDevelopers error:', e);
    }
  }

  // Delete Developer
  async deleteDeveloper(devId: number): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DEVELOPERS, devId.toString()));
    } catch (e) {
      console.warn('Firestore deleteDeveloper error:', e);
    }
  }

  // Send / Save Chat Message (Realtime Sync to all clients)
  async sendChatMessage(message: ChatMessage): Promise<void> {
    try {
      const msgId = message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const msgToSave: ChatMessage = {
        ...message,
        id: msgId,
        createdAt: message.createdAt || Date.now(),
      };
      await setDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, msgId), msgToSave);
      // Also broadcast locally for instant tab responsiveness
      realtimeBus.broadcast('NEW_MESSAGE', msgToSave);
    } catch (e) {
      console.warn('Firestore sendChatMessage error:', e);
      // Fallback local broadcast
      realtimeBus.broadcast('NEW_MESSAGE', message);
    }
  }

  // Delete Chat Message
  async deleteChatMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CHAT_MESSAGES, messageId));
    } catch (e) {
      console.warn('Firestore deleteChatMessage error:', e);
    }
  }

  // Clear specific chat history
  async clearDeveloperMessages(developerId?: number): Promise<void> {
    try {
      const colRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatMessage;
        if (developerId === undefined || data.developerId === developerId) {
          batch.delete(docSnap.ref);
        }
      });
      await batch.commit();
    } catch (e) {
      console.warn('Firestore clearDeveloperMessages error:', e);
    }
  }

  // Save Payment Request
  async savePaymentRequest(request: PaymentRequest): Promise<void> {
    try {
      const pDoc = doc(db, COLLECTIONS.PAYMENT_REQUESTS, request.id);
      await setDoc(pDoc, request, { merge: true });
      realtimeBus.broadcast('PAYMENT_UPDATED', request);
    } catch (e) {
      console.warn('Firestore savePaymentRequest error:', e);
    }
  }

  // Save Service Order
  async saveOrder(order: ServiceOrder): Promise<void> {
    try {
      const oDoc = doc(db, COLLECTIONS.ORDERS, order.id);
      await setDoc(oDoc, order, { merge: true });
      realtimeBus.broadcast('ORDER_UPDATED', order);
    } catch (e) {
      console.warn('Firestore saveOrder error:', e);
    }
  }

  // Delete Service Order
  async deleteOrder(orderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    } catch (e) {
      console.warn('Firestore deleteOrder error:', e);
    }
  }

  // Save Withdraw Request
  async saveWithdrawRequest(request: SellerWithdrawRequest): Promise<void> {
    try {
      const wDoc = doc(db, COLLECTIONS.WITHDRAW_REQUESTS, request.id);
      await setDoc(wDoc, request, { merge: true });
    } catch (e) {
      console.warn('Firestore saveWithdrawRequest error:', e);
    }
  }

  // Save Site Config
  async saveSiteConfig(config: SiteConfig): Promise<void> {
    try {
      const cfgDoc = doc(db, COLLECTIONS.SYSTEM_CONFIG, CONFIG_DOCS.SITE_CONFIG);
      await setDoc(cfgDoc, config, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSiteConfig error:', e);
    }
  }

  // Save Payment Settings
  async savePaymentSettings(settings: PaymentSettings): Promise<void> {
    try {
      const payDoc = doc(db, COLLECTIONS.SYSTEM_CONFIG, CONFIG_DOCS.PAYMENT_SETTINGS);
      await setDoc(payDoc, settings, { merge: true });
    } catch (e) {
      console.warn('Firestore savePaymentSettings error:', e);
    }
  }

  // Save Single Bot Reply
  async saveBotReply(reply: BotAutoReply): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.BOT_REPLIES, reply.id), reply, { merge: true });
    } catch (e) {
      console.warn('Firestore saveBotReply error:', e);
    }
  }

  // Delete Bot Reply
  async deleteBotReply(replyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.BOT_REPLIES, replyId));
    } catch (e) {
      console.warn('Firestore deleteBotReply error:', e);
    }
  }

  // Save Bot Replies
  async saveBotReplies(replies: BotAutoReply[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const r of replies) {
        batch.set(doc(db, COLLECTIONS.BOT_REPLIES, r.id), r, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore saveBotReplies error:', e);
    }
  }

  // Save Recharge Packages
  async saveRechargePackages(packages: RechargePackage[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const p of packages) {
        batch.set(doc(db, COLLECTIONS.RECHARGE_PACKAGES, p.id), p, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore saveRechargePackages error:', e);
    }
  }

  // --- Firebase Storage & Calling Access Requests ---
  async saveAccessRequest(request: FirebaseAccessRequest): Promise<void> {
    try {
      const rDoc = doc(db, COLLECTIONS.ACCESS_REQUESTS, request.id);
      await setDoc(rDoc, request, { merge: true });
    } catch (e) {
      console.warn('Firestore saveAccessRequest error:', e);
    }
  }

  async deleteAccessRequest(requestId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ACCESS_REQUESTS, requestId));
    } catch (e) {
      console.warn('Firestore deleteAccessRequest error:', e);
    }
  }

  async approveAccessRequest(requestId: string, targetUserId: string, adminNote?: string): Promise<void> {
    try {
      // 1. Update request record
      const rDoc = doc(db, COLLECTIONS.ACCESS_REQUESTS, requestId);
      await updateDoc(rDoc, {
        status: 'approved',
        approvedAt: new Date().toLocaleString('bn-BD'),
        adminNote: adminNote || 'ওনার কর্তৃক ফায়ারবেস অ্যাক্সেস অনুমোদিত হয়েছে।',
      });

      // 2. Grant access to user account
      const uDoc = doc(db, COLLECTIONS.USERS, targetUserId);
      await updateDoc(uDoc, {
        firebaseAccessGranted: true,
        firebaseRequestStatus: 'approved',
      });
    } catch (e) {
      console.warn('Firestore approveAccessRequest error:', e);
    }
  }

  async rejectAccessRequest(requestId: string, targetUserId: string, adminNote?: string): Promise<void> {
    try {
      const rDoc = doc(db, COLLECTIONS.ACCESS_REQUESTS, requestId);
      await updateDoc(rDoc, {
        status: 'rejected',
        adminNote: adminNote || 'অনুরোধটি ওনার কর্তৃক পর্যালোচনা শেষে বাতিল করা হয়েছে।',
      });

      const uDoc = doc(db, COLLECTIONS.USERS, targetUserId);
      await updateDoc(uDoc, {
        firebaseAccessGranted: false,
        firebaseRequestStatus: 'rejected',
      });
    } catch (e) {
      console.warn('Firestore rejectAccessRequest error:', e);
    }
  }

  // --- Realtime WebRTC Cloud Signaling ---
  async sendCallSignal(signalData: {
    callSessionId: string;
    type: 'OFFER' | 'ANSWER' | 'CANDIDATE' | 'ACCEPT' | 'REJECT' | 'END';
    fromUserId: string;
    fromUserName: string;
    toDeveloperId?: number;
    toUserId?: string;
    payload: any;
  }): Promise<void> {
    try {
      const sigDoc = doc(db, COLLECTIONS.CALL_SIGNALS, signalData.callSessionId);
      await setDoc(
        sigDoc,
        {
          ...signalData,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore sendCallSignal error:', e);
    }
  }

  listenToCallSignals(callSessionId: string, onSignal: (data: any) => void): () => void {
    try {
      const sigDoc = doc(db, COLLECTIONS.CALL_SIGNALS, callSessionId);
      return onSnapshot(sigDoc, (snap) => {
        if (snap.exists()) {
          onSignal(snap.data());
        }
      });
    } catch (e) {
      console.warn('Firestore listenToCallSignals error:', e);
      return () => {};
    }
  }

  // --- Complete Cloud Database Backup & Restore Engine ---

  /**
   * Creates a full system snapshot and stores it in Firestore Database Backups
   */
  async createCloudBackup(params: {
    creatorName?: string;
    note?: string;
    users: UserAccount[];
    developers: Developer[];
    messages: ChatMessage[];
    payments: PaymentRequest[];
    orders: ServiceOrder[];
    withdraws: SellerWithdrawRequest[];
    siteConfig: SiteConfig;
    paymentSettings: PaymentSettings;
    botReplies: BotAutoReply[];
    rechargePackages: RechargePackage[];
  }): Promise<DatabaseBackupRecord> {
    const backupId = `BACKUP-${Date.now()}`;
    const timestamp = Date.now();
    const createdAt = new Date().toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const record: DatabaseBackupRecord = {
      id: backupId,
      createdAt,
      timestamp,
      note: params.note || 'সম্পূর্ণ ক্লাউড ডাটাবেজ ব্যাকআপ',
      creatorName: params.creatorName || 'ওনার অ্যাডমিন',
      counts: {
        users: params.users.length,
        developers: params.developers.length,
        messages: params.messages.length,
        payments: params.payments.length,
        orders: params.orders.length,
        withdraws: params.withdraws.length,
      },
      data: {
        users: params.users,
        developers: params.developers,
        messages: params.messages,
        payments: params.payments,
        orders: params.orders,
        withdraws: params.withdraws,
        siteConfig: params.siteConfig,
        paymentSettings: params.paymentSettings,
        botReplies: params.botReplies,
        rechargePackages: params.rechargePackages,
      },
    };

    try {
      await setDoc(doc(db, COLLECTIONS.DATABASE_BACKUPS, backupId), record);
    } catch (e) {
      console.warn('Firestore createCloudBackup error:', e);
    }

    return record;
  }

  /**
   * Fetch all Cloud Backups list
   */
  async getCloudBackups(): Promise<DatabaseBackupRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.DATABASE_BACKUPS),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const list: DatabaseBackupRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as DatabaseBackupRecord);
      });
      return list;
    } catch (e) {
      console.warn('Firestore getCloudBackups error:', e);
      return [];
    }
  }

  /**
   * Delete a specific Cloud Backup
   */
  async deleteCloudBackup(backupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DATABASE_BACKUPS, backupId));
    } catch (e) {
      console.warn('Firestore deleteCloudBackup error:', e);
    }
  }

  /**
   * Restore all Firestore collections from a selected DatabaseBackupRecord
   */
  async restoreFromBackup(backup: DatabaseBackupRecord): Promise<boolean> {
    if (!backup.data) return false;
    try {
      const {
        users,
        developers,
        messages,
        payments,
        orders,
        withdraws,
        siteConfig,
        paymentSettings,
        botReplies,
        rechargePackages,
      } = backup.data;

      // 1. Users
      if (users && users.length > 0) {
        await this.saveUsers(users);
      }

      // 2. Developers
      if (developers && developers.length > 0) {
        await this.saveDevelopers(developers);
      }

      // 3. Messages
      if (messages && messages.length > 0) {
        const batch = writeBatch(db);
        for (const m of messages) {
          batch.set(doc(db, COLLECTIONS.CHAT_MESSAGES, m.id), m);
        }
        await batch.commit();
      }

      // 4. Payments
      if (payments && payments.length > 0) {
        const batch = writeBatch(db);
        for (const p of payments) {
          batch.set(doc(db, COLLECTIONS.PAYMENT_REQUESTS, p.id), p);
        }
        await batch.commit();
      }

      // 5. Orders
      if (orders && orders.length > 0) {
        const batch = writeBatch(db);
        for (const o of orders) {
          batch.set(doc(db, COLLECTIONS.ORDERS, o.id), o);
        }
        await batch.commit();
      }

      // 6. Withdraws
      if (withdraws && withdraws.length > 0) {
        const batch = writeBatch(db);
        for (const w of withdraws) {
          batch.set(doc(db, COLLECTIONS.WITHDRAW_REQUESTS, w.id), w);
        }
        await batch.commit();
      }

      // 7. Site Config & Payment Settings
      if (siteConfig) {
        await this.saveSiteConfig(siteConfig);
      }
      if (paymentSettings) {
        await this.savePaymentSettings(paymentSettings);
      }

      // 8. Bot Replies & Recharge Packages
      if (botReplies && botReplies.length > 0) {
        await this.saveBotReplies(botReplies);
      }
      if (rechargePackages && rechargePackages.length > 0) {
        await this.saveRechargePackages(rechargePackages);
      }

      return true;
    } catch (e) {
      console.error('Failed to restore database from backup:', e);
      return false;
    }
  }
}

export const firebaseSync = new FirebaseSyncService();
