import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase/firebase';

export interface AppUser {
  id?: string;
  uid?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

const USERS_COLLECTION = 'users';

// Default Admin Email configured via env or fallback
const DEFAULT_ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'pqhacker@gmail.com';

export const userService = {
  /**
   * Check user status or bootstrap initial admin account upon login
   */
  async checkAndSyncUser(firebaseUser: User): Promise<AppUser | null> {
    const userEmail = firebaseUser.email?.toLowerCase().trim();
    if (!userEmail) return null;

    // 1. Try to get document by UID
    const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data() as AppUser;
      
      // Auto-upgrade to admin if email matches DEFAULT_ADMIN_EMAIL
      if (userEmail === DEFAULT_ADMIN_EMAIL.toLowerCase().trim() && (data.role !== 'admin' || !data.active)) {
        data.role = 'admin';
        data.active = true;
        await updateDoc(userDocRef, {
          role: 'admin',
          active: true,
          updatedAt: new Date().toISOString(),
        });
      }

      // Update display name / photo if changed
      if (
        data.displayName !== (firebaseUser.displayName || '') ||
        data.photoURL !== (firebaseUser.photoURL || '')
      ) {
        await updateDoc(userDocRef, {
          displayName: firebaseUser.displayName || data.displayName || '',
          photoURL: firebaseUser.photoURL || data.photoURL || '',
          updatedAt: new Date().toISOString(),
        });
      }

      if (!data.active) {
        return { ...data, id: userDocSnap.id, active: false };
      }
      return { ...data, id: userDocSnap.id, role: data.role || 'user' };
    }

    // 2. Query by Email if not found by UID (Admin pre-approved email before user first logged in)
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const matchedDoc = querySnapshot.docs[0];
      const matchedData = matchedDoc.data() as AppUser;

      // Link this doc to the real Auth UID
      const updatedUser: AppUser = {
        ...matchedData,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || matchedData.displayName || userEmail.split('@')[0],
        photoURL: firebaseUser.photoURL || matchedData.photoURL || '',
        updatedAt: new Date().toISOString(),
      };

      // Set under UID doc key and remove old pre-approved email key if different
      await setDoc(userDocRef, updatedUser);
      if (matchedDoc.id !== firebaseUser.uid) {
        try {
          await deleteDoc(matchedDoc.ref);
        } catch (e) {
          console.warn('Could not delete temp doc:', e);
        }
      }

      if (!updatedUser.active) {
        return { ...updatedUser, id: firebaseUser.uid, active: false };
      }
      return { ...updatedUser, id: firebaseUser.uid };
    }

    // 3. Initial Admin Bootstrapping Check (Requirement 17)
    // If the logged in user matches VITE_ADMIN_EMAIL, automatically create admin role
    if (userEmail === DEFAULT_ADMIN_EMAIL.toLowerCase().trim()) {
      const initialAdmin: AppUser = {
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: firebaseUser.displayName || 'System Admin',
        photoURL: firebaseUser.photoURL || '',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, initialAdmin);
      return { ...initialAdmin, id: firebaseUser.uid };
    }

    // 4. New user not in Firestore and not admin -> Unauthorized (Requirement 11)
    return null;
  },

  /**
   * Listen to real-time users collection updates for Admin
   */
  subscribeUsers(callback: (users: AppUser[]) => void) {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: AppUser[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppUser, 'id'>),
        }));
        // Sort by createdAt descending
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  },

  /**
   * Admin adds a new pre-approved user
   */
  async addUser(newUser: { email: string; displayName?: string; role: 'admin' | 'user'; active: boolean }): Promise<void> {
    const cleanEmail = newUser.email.toLowerCase().trim();
    if (!cleanEmail) throw new Error('Email không được để trống');

    // Query if already exists
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Tài khoản Gmail này đã tồn tại trong hệ thống!');
    }

    const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const userDocRef = doc(db, USERS_COLLECTION, docId);

    const appUserData: AppUser = {
      email: cleanEmail,
      displayName: newUser.displayName || cleanEmail.split('@')[0],
      photoURL: '',
      role: newUser.role,
      active: newUser.active,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, appUserData);
  },

  /**
   * Admin updates user role or active status
   */
  async updateUser(docId: string, updates: Partial<Pick<AppUser, 'role' | 'active' | 'displayName'>>): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, docId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Admin deletes a user account
   */
  async deleteUser(docId: string): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, docId);
    await deleteDoc(userDocRef);
  }
};
