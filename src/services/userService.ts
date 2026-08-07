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
import { db } from '../firebase/firebase';

export interface AppUser {
  id?: string;
  username: string;
  email?: string;
  password?: string;
  displayName?: string;
  role: 'admin' | 'user';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

const USERS_COLLECTION = 'users';

export const userService = {
  /**
   * Ensure default admin account exists and has a valid password in Firestore
   */
  async ensureDefaultAdmin(): Promise<AppUser> {
    const adminDocRef = doc(db, USERS_COLLECTION, 'admin');
    
    try {
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data() as AppUser;
        const updatedFields: Partial<AppUser> = {};

        if (!data.password) updatedFields.password = 'admin123';
        if (!data.username) updatedFields.username = 'admin';
        if (data.role !== 'admin') updatedFields.role = 'admin';
        if (data.active !== true) updatedFields.active = true;

        if (Object.keys(updatedFields).length > 0) {
          await setDoc(adminDocRef, updatedFields, { merge: true });
        }

        return {
          ...data,
          ...updatedFields,
          id: 'admin',
          username: data.username || 'admin',
          email: data.email || 'admin@system.local',
          password: data.password || 'admin123',
        };
      }

      // Check if any admin doc exists in query
      const q = query(collection(db, USERS_COLLECTION), where('username', '==', 'admin'));
      const qSnap = await getDocs(q);

      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        const data = firstDoc.data() as AppUser;
        if (!data.password) {
          await updateDoc(firstDoc.ref, { password: 'admin123' });
          data.password = 'admin123';
        }
        return { ...data, id: firstDoc.id, password: data.password || 'admin123' };
      }
    } catch (err) {
      console.warn('Error fetching or setting admin in Firestore:', err);
    }

    // Default Admin Account
    const defaultAdmin: AppUser = {
      username: 'admin',
      email: 'admin@system.local',
      password: 'admin123',
      displayName: 'Quản trị viên Hệ thống',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(adminDocRef, defaultAdmin, { merge: true });
    } catch (err) {
      console.error('Error creating default admin doc:', err);
    }

    return { ...defaultAdmin, id: 'admin' };
  },

  /**
   * Authenticate user with username/email & password
   */
  async authenticateUser(usernameInput: string, passwordInput: string): Promise<AppUser> {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    // Always ensure default admin exists if logging in as admin
    if (cleanUsername === 'admin' || cleanUsername === 'admin@system.local') {
      await this.ensureDefaultAdmin();
    }

    // 1. Check doc ID directly (e.g. 'admin' or formatted doc ID)
    const formattedId = cleanUsername.replace(/[^a-zA-Z0-9]/g, '_');
    const userDocRef = doc(db, USERS_COLLECTION, formattedId);
    let matchedUser: AppUser | null = null;
    let matchedId = '';

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        matchedUser = userDocSnap.data() as AppUser;
        matchedId = userDocSnap.id;
      }
    } catch (e) {
      console.warn('Direct doc lookup error:', e);
    }

    if (!matchedUser) {
      // 2. Query by username or email field
      try {
        const qUsername = query(collection(db, USERS_COLLECTION), where('username', '==', cleanUsername));
        const qSnapUsername = await getDocs(qUsername);

        if (!qSnapUsername.empty) {
          matchedUser = qSnapUsername.docs[0].data() as AppUser;
          matchedId = qSnapUsername.docs[0].id;
        } else {
          const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', cleanUsername));
          const qSnapEmail = await getDocs(qEmail);

          if (!qSnapEmail.empty) {
            matchedUser = qSnapEmail.docs[0].data() as AppUser;
            matchedId = qSnapEmail.docs[0].id;
          }
        }
      } catch (e) {
        console.warn('Query lookup error:', e);
      }
    }

    // Fallback if logging in as admin and matchedUser still null or missing password
    if (cleanUsername === 'admin' || cleanUsername === 'admin@system.local') {
      if (!matchedUser) {
        matchedUser = await this.ensureDefaultAdmin();
        matchedId = 'admin';
      } else if (!matchedUser.password) {
        matchedUser.password = 'admin123';
      }
    }

    if (!matchedUser) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    const effectivePassword = matchedUser.password || (matchedUser.username === 'admin' ? 'admin123' : '');

    if (effectivePassword !== cleanPassword) {
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    if (matchedUser.active === false) {
      throw new Error('Tài khoản này đã bị khóa hoặc chưa được kích hoạt bởi Admin.');
    }

    return {
      ...matchedUser,
      id: matchedId || 'admin',
      username: matchedUser.username || matchedUser.email || cleanUsername,
      email: matchedUser.email || matchedUser.username || cleanUsername,
    };
  },

  /**
   * Fetch single user profile by doc ID
   */
  async getUserById(docId: string): Promise<AppUser | null> {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, docId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as AppUser;
        return {
          ...data,
          id: snap.id,
          username: data.username || data.email || snap.id,
          email: data.email || data.username || snap.id,
        };
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
    return null;
  },

  /**
   * Change user password
   */
  async changePassword(docId: string, oldPassword: string, newPassword: string): Promise<void> {
    const cleanOld = (oldPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (!cleanOld) {
      throw new Error('Vui lòng nhập mật khẩu hiện tại.');
    }
    if (!cleanNew || cleanNew.length < 4) {
      throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự.');
    }

    const userDocRef = doc(db, USERS_COLLECTION, docId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      throw new Error('Không tìm thấy thông tin tài khoản.');
    }

    const data = snap.data() as AppUser;
    const currentPass = data.password || (data.username === 'admin' ? 'admin123' : '');

    if (currentPass !== cleanOld) {
      throw new Error('Mật khẩu hiện tại không chính xác.');
    }

    if (currentPass === cleanNew) {
      throw new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    }

    await updateDoc(userDocRef, {
      password: cleanNew,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Listen to real-time users collection updates for Admin
   */
  subscribeUsers(callback: (users: AppUser[]) => void) {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: AppUser[] = snapshot.docs.map((d) => {
          const data = d.data() as AppUser;
          return {
            id: d.id,
            ...data,
            username: data.username || data.email || d.id,
            email: data.email || data.username || d.id,
          };
        });
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
   * Admin adds a new user with username and password
   */
  async addUser(newUser: { 
    username: string; 
    password: string; 
    displayName?: string; 
    role: 'admin' | 'user'; 
    active: boolean 
  }): Promise<void> {
    const cleanUsername = newUser.username.toLowerCase().trim();
    if (!cleanUsername) throw new Error('Tên đăng nhập không được để trống');
    if (!newUser.password || newUser.password.trim().length < 4) {
      throw new Error('Mật khẩu phải có ít nhất 4 ký tự');
    }

    const docId = cleanUsername.replace(/[^a-zA-Z0-9]/g, '_');

    // Query if already exists
    const userDocRef = doc(db, USERS_COLLECTION, docId);
    const existingSnap = await getDoc(userDocRef);

    if (existingSnap.exists()) {
      throw new Error(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống!`);
    }

    const appUserData: AppUser = {
      username: cleanUsername,
      email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@system.local`,
      password: newUser.password.trim(),
      displayName: newUser.displayName || cleanUsername,
      role: newUser.role,
      active: newUser.active,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, appUserData);
  },

  /**
   * Admin updates user role, active status, display name, or password
   */
  async updateUser(docId: string, updates: Partial<Pick<AppUser, 'role' | 'active' | 'displayName' | 'password'>>): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, docId);
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.displayName !== undefined) payload.displayName = updates.displayName;
    if (updates.password && updates.password.trim().length >= 4) {
      payload.password = updates.password.trim();
    }

    await updateDoc(userDocRef, payload);
  },

  /**
   * Admin deletes a user account
   */
  async deleteUser(docId: string): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, docId);
    await deleteDoc(userDocRef);
  }
};

