import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onValue, set, remove, push, get, update } from 'firebase/database';
import { auth, database } from '../firebase';
import { SavedLead, UserProfile, UserRole, Store, SavedView, ActivityLogType, ActivityLogEntry, TMobileUpgradeData, QuoteTemplate } from '../types';
import { cleanForFirebase } from '../utils/firebaseUtils';
import { INITIAL_PROMOTIONS, INITIAL_GUIDANCE_ITEMS, INITIAL_SERVICE_PLANS, INITIAL_PLANS, INITIAL_INSURANCE_PLANS, INITIAL_UPGRADE_DATA, INITIAL_DEVICE_DATABASE } from '../constants';

// Helper to safely convert Firebase's array-like objects to arrays
const firebaseObjectToArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.values(data);
};

// Helper to compare string arrays for tag change detection
const areArraysEqual = (a: string[] | undefined, b: string[] | undefined): boolean => {
    const arrA = a || [];
    const arrB = b || [];
    if (arrA.length !== arrB.length) return false;
    const sortedA = [...arrA].sort();
    const sortedB = [...arrB].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

// --- AUTHENTICATION ---

export const onAuthStateChange = (callback: (user: User | null, profile: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            const userProfileRef = ref(database, `users/${currentUser.uid}`);
            const snapshot = await get(userProfileRef);
            if (snapshot.exists()) {
                callback(currentUser, snapshot.val() as UserProfile);
            } else {
                const newProfile: UserProfile = {
                    uid: currentUser.uid,
                    email: currentUser.email || 'No Email',
                    displayName: currentUser.displayName || (currentUser.email?.split('@')[0] || 'New User'),
                    phoneNumber: '',
                    storeId: null,
                    role: UserRole.REP, // Default role
                };
                await set(userProfileRef, newProfile);
                callback(currentUser, newProfile);
            }
        } else {
            callback(null, null);
        }
    });
};

export const authenticateUser = async (email: string, password: string, isSignUp: boolean) => {
    try {
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err: any) {
        let errorMessage = 'An unknown error occurred.';
        if (err.code) {
            switch (err.code) {
                case 'auth/invalid-email': errorMessage = 'Please enter a valid email address.'; break;
                case 'auth/user-not-found': errorMessage = 'No account found with that email.'; break;
                case 'auth/wrong-password': errorMessage = 'Incorrect password. Please try again.'; break;
                case 'auth/email-already-in-use': errorMessage = 'An account already exists with this email address.'; break;
                case 'auth/weak-password': errorMessage = 'Password should be at least 6 characters.'; break;
                default: errorMessage = err.message;
            }
        }
        throw new Error(errorMessage);
    }
};

export const signOutUser = () => signOut(auth);

export const updateUserProfile = (uid: string, profile: Partial<UserProfile>) => {
    const userProfileRef = ref(database, `users/${uid}`);
    return update(userProfileRef, profile);
};


// --- DATA SUBSCRIPTIONS ---

export const subscribeToSettings = (callback: (data: any) => void) => {
    const settingsRef = ref(database, 'settings');
    return onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        const settings = {
            plans: firebaseObjectToArray(data?.plans),
            servicePlans: firebaseObjectToArray(data?.servicePlans),
            discounts: data?.discounts,
            insurance: firebaseObjectToArray(data?.insurance),
            promotions: firebaseObjectToArray(data?.promotions),
            guidanceItems: firebaseObjectToArray(data?.guidanceItems),
            upgradeData: data?.upgradeData,
            deviceDatabase: data?.deviceDatabase,
        };
        callback(settings);
    });
};

export const subscribeToLeads = (callback: (leads: SavedLead[]) => void) => {
    const leadsRef = ref(database, 'leads');
    return onValue(leadsRef, (snapshot) => {
        const data = snapshot.val();
        const leadsArray: SavedLead[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(leadsArray);
    });
};

export const subscribeToStores = (callback: (stores: Store[]) => void) => {
    const storesRef = ref(database, 'stores');
    return onValue(storesRef, (snapshot) => {
        const data = snapshot.val();
        const storesArray: Store[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(storesArray);
    });
};

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
    const usersRef = ref(database, 'users');
    return onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const usersArray: UserProfile[] = data ? Object.keys(data).map(key => ({
            ...data[key],
            uid: key, // Ensure the uid is always present from the object key
        })) : [];
        callback(usersArray);
    });
};

export const subscribeToSavedViews = (uid: string, callback: (views: SavedView[]) => void) => {
    const viewsRef = ref(database, `user_settings/${uid}/savedViews`);
    return onValue(viewsRef, (snapshot) => {
        const data = snapshot.val();
        const viewsArray: SavedView[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(viewsArray);
    });
};

export const subscribeToQuoteTemplates = (uid: string, callback: (templates: QuoteTemplate[]) => void) => {
    const templatesRef = ref(database, `user_settings/${uid}/savedTemplates`);
    return onValue(templatesRef, (snapshot) => {
        const data = snapshot.val();
        const templatesArray: QuoteTemplate[] = firebaseObjectToArray(data);
        callback(templatesArray);
    });
};

// --- DATA MANIPULATION ---

export const saveLead = (leadData: Omit<SavedLead, 'id'>) => {
    const newLeadRef = push(ref(database, 'leads'));
    return set(newLeadRef, cleanForFirebase(leadData));
};

export const updateLead = (leadId: string, leadData: SavedLead) => {
    return set(ref(database, `leads/${leadId}`), cleanForFirebase(leadData));
};

export const deleteLead = (leadId: string) => {
    return remove(ref(database, `leads/${leadId}`));
};

export const updateLeadDetails = (leadId: string, updates: Partial<SavedLead>, currentLead: SavedLead, userProfile: UserProfile, allUsers: UserProfile[]) => {
    const now = Date.now();
    const newActivityLog: ActivityLogEntry[] = [];
    const authorId = userProfile.uid;

    if (updates.status && updates.status !== currentLead.status) newActivityLog.push({ id: crypto.randomUUID(), type: ActivityLogType.STATUS_CHANGE, timestamp: now, by: authorId, from: currentLead.status, to: updates.status });
    if (updates.notes && updates.notes !== currentLead.notes) newActivityLog.push({ id: crypto.randomUUID(), type: ActivityLogType.NOTES_UPDATED, timestamp: now, by: authorId });
    if (updates.followUpAt !== currentLead.followUpAt) newActivityLog.push({ id: crypto.randomUUID(), type: ActivityLogType.FOLLOW_UP_SET, timestamp: now, by: authorId, to: updates.followUpAt ? new Date(updates.followUpAt).toLocaleString() : 'None' });
    if (updates.tags && !areArraysEqual(updates.tags, currentLead.tags)) newActivityLog.push({ id: crypto.randomUUID(), type: ActivityLogType.TAGS_UPDATED, timestamp: now, by: authorId });
    if (updates.assignedToUid && updates.assignedToUid !== currentLead.assignedToUid) {
        const newAssignee = allUsers.find(u => u.uid === updates.assignedToUid)?.displayName || 'Unknown';
        newActivityLog.push({ id: crypto.randomUUID(), type: ActivityLogType.REASSIGNED, timestamp: now, by: authorId, to: newAssignee });
    }
    
    const finalUpdates = { ...updates, updatedAt: now, activityLog: [...(currentLead.activityLog || []), ...newActivityLog] };
    return update(ref(database, `leads/${leadId}`), cleanForFirebase(finalUpdates));
};

export const bulkUpdateLeads = async (leadIds: string[], updates: Partial<SavedLead>, allLeads: SavedLead[], userProfile: UserProfile) => {
    const updatesForFirebase: { [key: string]: any } = {};
    const now = Date.now();
    leadIds.forEach(id => {
        const currentLead = allLeads.find(l => l.id === id);
        if (currentLead && currentLead.status !== updates.status) {
            const activityLogEntry: ActivityLogEntry = { id: crypto.randomUUID(), type: ActivityLogType.STATUS_CHANGE, timestamp: now, by: userProfile.uid, from: currentLead.status, to: updates.status };
            updatesForFirebase[`/leads/${id}/status`] = updates.status;
            updatesForFirebase[`/leads/${id}/updatedAt`] = now;
            updatesForFirebase[`/leads/${id}/activityLog`] = [...(currentLead.activityLog || []), activityLogEntry];
        }
    });
    if (Object.keys(updatesForFirebase).length > 0) {
        await update(ref(database), updatesForFirebase);
        return { success: true };
    }
    return { success: false };
};

export const bulkDeleteLeads = (leadIds: string[]) => {
    const updatesForFirebase: { [key: string]: null } = {};
    leadIds.forEach(id => { updatesForFirebase[`/leads/${id}`] = null; });
    return update(ref(database), updatesForFirebase);
};

export const saveUserView = (uid: string, view: Omit<SavedView, 'id'>) => {
    const newViewRef = push(ref(database, `user_settings/${uid}/savedViews`));
    return set(newViewRef, view);
};

export const deleteUserView = (uid: string, viewId: string) => {
    return remove(ref(database, `user_settings/${uid}/savedViews/${viewId}`));
};

export const saveUserTemplates = (uid: string, templates: QuoteTemplate[]) => {
    const templatesRef = ref(database, `user_settings/${uid}/savedTemplates`);
    return set(templatesRef, cleanForFirebase(templates));
};

// --- ADMIN & INITIALIZATION ---

export const initializeStores = (stores: Store[]) => {
    const storesRef = ref(database, 'stores');
    const updates = stores.reduce((acc, store) => ({ ...acc, [store.id]: store }), {});
    return set(storesRef, updates);
};

export const saveAllAdminSettings = (newSettings: any, allStores: Store[], allUsers: UserProfile[]) => {
    const updates: { [key: string]: any } = {};
    updates['/settings'] = cleanForFirebase({
        plans: newSettings.plans,
        servicePlans: newSettings.servicePlans,
        discounts: newSettings.discounts,
        insurance: newSettings.insurance,
        promotions: newSettings.promotions,
        guidanceItems: newSettings.guidanceItems,
        upgradeData: newSettings.upgradeData,
        deviceDatabase: newSettings.deviceDatabase,
    });

    const originalStoreIds = new Set(allStores.map(s => s.id));
    const newStoreIds = new Set(newSettings.stores.map((s: Store) => s.id));
    originalStoreIds.forEach(id => { if (!newStoreIds.has(id)) updates[`/stores/${id}`] = null; });
    newSettings.stores.forEach((store: Store) => { updates[`/stores/${store.id}`] = cleanForFirebase(store); });

    const originalUserUids = new Set(allUsers.map(u => u.uid));
    const newUserUids = new Set(newSettings.users.map((u: UserProfile) => u.uid));
    originalUserUids.forEach(uid => { if (!newUserUids.has(uid)) updates[`/users/${uid}`] = null; });
    newSettings.users.forEach((user: UserProfile) => { updates[`/users/${user.uid}`] = cleanForFirebase(user); });

    return update(ref(database), updates);
};

export const resetDefaultSettings = () => {
    const defaultSettings = {
        plans: INITIAL_PLANS,
        servicePlans: INITIAL_SERVICE_PLANS,
        discounts: { autopay: 5, insider: 20, thirdLineFree: 0 },
        insurance: INITIAL_INSURANCE_PLANS,
        promotions: INITIAL_PROMOTIONS,
        guidanceItems: INITIAL_GUIDANCE_ITEMS,
        upgradeData: INITIAL_UPGRADE_DATA,
        deviceDatabase: INITIAL_DEVICE_DATABASE,
    };
    return set(ref(database, 'settings'), defaultSettings);
};