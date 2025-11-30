'use client';

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  orderBy,
  serverTimestamp,
  Firestore,
  setDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, AuthErrorCodes, signInWithEmailAndPassword } from 'firebase/auth';
import type { Mountain, InfoItem, Reservation, InfoCategory, Feedback, UserProfile, Company, Tour, Coupon } from './definitions';
import { slugify } from './utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- User Friendly Error Handling ---
function handleAuthError(error: any): string {
    if (error.code) {
        switch (error.code) {
            case AuthErrorCodes.INVALID_EMAIL:
            case AuthErrorCodes.USER_NOT_FOUND:
            case AuthErrorCodes.WRONG_PASSWORD:
            case 'auth/invalid-credential':
                return 'Email və ya parol səhvdir.';
            case AuthErrorCodes.EMAIL_EXISTS:
                return 'Bu email artıq istifadə olunur.';
            case AuthErrorCodes.WEAK_PASSWORD:
                return 'Parol çox zəifdir. Ən azı 6 simvol olmalıdır.';
            default:
                return 'Bilinməyən bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
        }
    }
    return error.message || 'Bilinməyən bir xəta baş verdi.';
}


// --- User & Agent Creation ---

async function createAuthUser(email: string, password: string): Promise<string> {
    const auth = getAuth();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user.uid;
    } catch (error) {
        throw new Error(handleAuthError(error));
    }
}

export async function createUserProfile(db: Firestore, data: Omit<UserProfile, 'email' | 'balance' | 'toursAttended' | 'referralBonusClaimed'> & { email: string; password?: string; referredBy?: string }) {
    if (!data.password) throw new Error("Parol məcburidir.");
    const userId = await createAuthUser(data.email, data.password);

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', userId);
    
    const profileData: UserProfile = {
        email: data.email,
        role: 'user',
        balance: 0,
        toursAttended: 0,
        referralBonusClaimed: false,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        name: data.name,
        gender: data.gender,
        age: data.age,
        family: data.family,
    };

    // Add welcome coupon
    const welcomeCouponRef = doc(collection(db, 'coupons'));
    const welcomeCoupon: Omit<Coupon, 'id'> = {
        userId,
        code: 'WELCOME10',
        description: 'İlk qeydiyyat üçün 10 XAL hədiyyə!',
        points: 10,
        isUsed: false,
        createdAt: serverTimestamp(),
    };
    batch.set(welcomeCouponRef, welcomeCoupon);
    
    Object.keys(profileData).forEach(key => {
        const k = key as keyof UserProfile;
        if(profileData[k] === undefined) delete (profileData as any)[k];
    });

    batch.set(userDocRef, profileData);

    try {
        await batch.commit();
    } catch (error) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `batch write for user ${userId}`,
            operation: 'create',
            requestResourceData: { profileData, welcomeCoupon }
        }));
        throw error;
    }
}

export async function createAgentProfile(db: Firestore, data: Omit<Company, 'id' | 'userId' | 'status' | 'createdAt' | 'email'> & { email: string; password?: string }) {
    if (!data.password) throw new Error("Parol məcburidir.");
    const userId = await createAuthUser(data.email, data.password);

    const batch = writeBatch(db);

    const userDocRef = doc(db, 'users', userId);
    const userProfileData: Partial<UserProfile> = {
        email: data.email,
        role: 'agent',
        balance: 0,
        toursAttended: 0,
        name: data.companyName,
    };
    batch.set(userDocRef, userProfileData, { merge: true });

    const companyDocRef = doc(collection(db, 'companies'));
    const companyData: Omit<Company, 'id'> = {
        userId: userId,
        email: data.email,
        companyName: data.companyName,
        phone: data.phone,
        address: data.address,
        licenseNumber: data.licenseNumber,
        description: data.description || '',
        status: 'pending',
        createdAt: serverTimestamp(),
    };
    batch.set(companyDocRef, companyData);

    try {
        await batch.commit();
    } catch (error) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `batch write for agent ${userId}`,
            operation: 'create',
            requestResourceData: { userProfileData, companyData }
        }));
        throw error;
    }
}


// --- User Profile Actions ---

export async function updateUserProfile(db: Firestore, userId: string, data: Partial<UserProfile | { balance: any }>) {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: data,
        }));
        throw error;
    });
}

export async function getUserProfile(db: Firestore, userId: string): Promise<UserProfile | null> {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...data,
            // ensure default values
            balance: data.balance || 0,
            toursAttended: data.toursAttended || 0,
        } as UserProfile;
    }
    return null;
}

export async function getAllUsers(db: Firestore): Promise<UserProfile[]> {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '==', 'user'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        balance: doc.data().balance || 0,
        toursAttended: doc.data().toursAttended || 0,
    } as UserProfile & {id: string}));
}


// --- Mountain Actions ---

export async function fetchMountains(db: Firestore): Promise<Mountain[]> {
  const mountainsCol = collection(db, 'mountains');
  const mountainSnapshot = await getDocs(query(mountainsCol, orderBy('name', 'asc')));
  const mountainList = mountainSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mountain));
  return mountainList;
}

export async function getMountainData(db: Firestore, mountainSlug: string): Promise<Mountain | null> {
    const q = query(collection(db, "mountains"), where("slug", "==", mountainSlug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Mountain;
}

export async function createOrUpdateMountain(db: Firestore, mountain: Omit<Mountain, 'id' | 'slug'>, id?: string): Promise<void> {
  const mountainSlug = slugify(mountain.name);
  const mountainData: Partial<Mountain> = { 
      ...mountain, 
      slug: mountainSlug,
  };
  
  Object.keys(mountainData).forEach(key => {
      const itemKey = key as keyof typeof mountainData;
      if (mountainData[itemKey] === '' || mountainData[itemKey] === undefined || mountainData[itemKey] === null) {
          delete mountainData[itemKey];
      }
  });

  if (id) {
    const mountainDoc = doc(db, 'mountains', id);
    updateDoc(mountainDoc, mountainData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: mountainDoc.path,
            operation: 'update',
            requestResourceData: mountainData
        }))
    });
  } else {
    const mountainsCol = collection(db, 'mountains');
    addDoc(mountainsCol, mountainData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: mountainsCol.path,
            operation: 'create',
            requestResourceData: mountainData
        }))
    });
  }
}

export async function deleteMountain(db: Firestore, id: string): Promise<void> {
  const mountainDoc = doc(db, 'mountains', id);
  deleteDoc(mountainDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mountainDoc.path,
        operation: 'delete'
    }))
  });

  const infoItemsSnapshot = await getDocs(query(collection(db, 'infoItems'), where('mountainId', '==', id)));
  const deletePromises = infoItemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// --- Info Item Actions ---

export async function fetchAllInfoItems(db: Firestore): Promise<InfoItem[]> {
  const infoItemsCol = collection(db, 'infoItems');
  const infoItemSnapshot = await getDocs(infoItemsCol);
  const infoItemList = infoItemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfoItem));
  return infoItemList;
}

export async function getItemsForMountain(db: Firestore, mountainSlug: string): Promise<InfoItem[]> {
  const q = query(collection(db, 'infoItems'), where('mountainSlug', '==', mountainSlug));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfoItem));
}

export async function getInfoItems(db: Firestore, mountainSlug: string, category: InfoCategory): Promise<InfoItem[]> {
  const q = query(collection(db, 'infoItems'), where('mountainSlug', '==', mountainSlug), where('category', '==', category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InfoItem));
}

export async function getInfoItemById(db: Firestore, itemId: string): Promise<InfoItem | null> {
  const itemDocRef = doc(db, 'infoItems', itemId);
  const itemDoc = await getDoc(itemDocRef);
  if (itemDoc.exists()) {
    const data = itemDoc.data();
    return { id: itemDoc.id, ...data } as InfoItem;
  }
  return null;
}

export async function getInfoItemByName(db: Firestore, name: string): Promise<InfoItem | null> {
    const q = query(collection(db, "infoItems"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as InfoItem;
}

export async function createOrUpdateInfoItem(db: Firestore, item: Partial<InfoItem>, id?: string): Promise<string> {
  if (id) {
    const itemDoc = doc(db, 'infoItems', id);
    await updateDoc(itemDoc, item).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemDoc.path,
            operation: 'update',
            requestResourceData: item
        }))
        throw error;
    });
    return id;
  } else {
    const infoItemsCol = collection(db, 'infoItems');
    const docRef = await addDoc(infoItemsCol, item).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: infoItemsCol.path,
            operation: 'create',
            requestResourceData: item
        }))
        throw error;
    });
    return docRef.id;
  }
}

export async function deleteInfoItem(db: Firestore, id: string): Promise<void> {
  const itemDoc = doc(db, 'infoItems', id);
  deleteDoc(itemDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: itemDoc.path,
        operation: 'delete'
    }))
  });
}

// --- Reservation Actions ---

export async function addReservation(db: Firestore, reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<void> {
  const reservationsCol = collection(db, 'reservations');
  addDoc(reservationsCol, {
    ...reservation,
    createdAt: serverTimestamp()
  }).then(docRef => {
    console.log("Reservation added with ID: ", docRef.id);
  }).catch(error => {
    console.error("Error adding reservation: ", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: reservationsCol.path,
        operation: 'create',
        requestResourceData: reservation
    }))
  });
}

export async function getReservations(db: Firestore): Promise<Reservation[]> {
    const reservationsCol = collection(db, 'reservations');
    const q = query(reservationsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        mountainSlug: data.mountainSlug,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      } as Reservation;
    });
}

// --- Feedback Actions ---

export async function addFeedback(db: Firestore, feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
  const feedbackCol = collection(db, 'feedback');
  addDoc(feedbackCol, {
    ...feedback,
    createdAt: serverTimestamp()
  }).then(docRef => {
    console.log("Feedback added with ID: ", docRef.id);
  }).catch(error => {
    console.error("Error adding feedback: ", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: feedbackCol.path,
        operation: 'create',
        requestResourceData: feedback
    }))
  });
}

export async function getFeedback(db: Firestore): Promise<Feedback[]> {
    const feedbackCol = collection(db, 'feedback');
    const q = query(feedbackCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      } as Feedback;
    });
}

// --- Company Actions ---
export async function getCompanies(db: Firestore): Promise<Company[]> {
    const companiesCol = collection(db, 'companies');
    const q = query(companiesCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      } as Company;
    });
}

export async function getCompanyByUserId(db: Firestore, userId: string): Promise<Company | null> {
    const q = query(collection(db, "companies"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const companyDoc = querySnapshot.docs[0];
    return { id: companyDoc.id, ...companyDoc.data() } as Company;
}


export async function approveCompany(db: Firestore, companyId: string): Promise<void> {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, { status: 'active' }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: companyDocRef.path,
            operation: 'update',
            requestResourceData: { status: 'active' },
        }));
        throw error;
    });
}


// --- Tour Actions ---
export async function createOrUpdateTour(db: Firestore, agentId: string, tour: Omit<Tour, 'id' | 'agentId' | 'status' | 'createdAt'>, id?: string): Promise<void> {
  const agentProfile = await getUserProfile(db, agentId);
  const tourData = {
    ...tour,
    agentId,
    agentName: agentProfile?.name || 'Unknown Agent',
    status: 'pending' as const, // Always pending on creation
  };

  if (id) {
    const tourDoc = doc(db, 'tours', id);
    // When updating, we don't change the status back to pending unless specified
    const { status, ...updateData } = tourData;
    await updateDoc(tourDoc, updateData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tourDoc.path, operation: 'update', requestResourceData: updateData }));
        throw error;
    });
  } else {
    const toursCol = collection(db, 'tours');
    await addDoc(toursCol, { ...tourData, createdAt: serverTimestamp() }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: toursCol.path, operation: 'create', requestResourceData: tourData }));
        throw error;
    });
  }
}

export async function updateTourStatus(db: Firestore, tourId: string, status: 'approved' | 'rejected') {
    const tourDoc = doc(db, 'tours', tourId);
    await updateDoc(tourDoc, { status }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tourDoc.path, operation: 'update', requestResourceData: { status } }));
        throw error;
    });
}


export async function fetchToursForAgent(db: Firestore, agentId: string): Promise<Tour[]> {
    const toursCol = collection(db, 'tours');
    const q = query(toursCol, where('agentId', '==', agentId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour));
}

export async function getAllTours(db: Firestore): Promise<Tour[]> {
    const toursCol = collection(db, 'tours');
    const q = query(toursCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      } as Tour;
    });
}

export async function deleteTour(db: Firestore, id: string): Promise<void> {
    const tourDoc = doc(db, 'tours', id);
    await deleteDoc(tourDoc).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tourDoc.path, operation: 'delete' }));
        throw error;
    });
}

// --- Coupon Actions ---

export async function getCouponsForUser(db: Firestore, userId: string): Promise<Coupon[]> {
    const couponsCol = collection(db, 'coupons');
    const q = query(couponsCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        } as Coupon;
    });
}

export async function claimCoupon(db: Firestore, userId: string, couponId: string): Promise<void> {
    const couponRef = doc(db, 'coupons', couponId);
    const userRef = doc(db, 'users', userId);

    const couponSnap = await getDoc(couponRef);
    if (!couponSnap.exists()) {
        throw new Error('Kupon tapılmadı.');
    }
    const coupon = couponSnap.data() as Coupon;
    if (coupon.isUsed) {
        throw new Error('Bu kupon artıq istifadə edilib.');
    }
    if (coupon.userId !== userId) {
        throw new Error('Bu kupon sizə aid deyil.');
    }
    
    const batch = writeBatch(db);
    batch.update(couponRef, { isUsed: true });
    batch.update(userRef, { balance: increment(coupon.points) });
    
    try {
      await batch.commit()
    } catch (error) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `batch write for coupon ${couponId} and user ${userId}`,
            operation: 'update',
        }));
        throw error;
    }
}


// --- Scoreboard Actions ---
export async function awardScoreboardPrizes(db: Firestore): Promise<void> {
    const userDocs = await getDocs(query(collection(db, 'users'), where('role', '==', 'user')));
    const users: (UserProfile & {id: string})[] = userDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & {id: string}));

    if (users.length === 0) return;

    const sortedUsers = users.sort((a, b) => {
        const toursDiff = (b.toursAttended || 0) - (a.toursAttended || 0);
        if (toursDiff !== 0) return toursDiff;
        return (b.balance || 0) - (a.balance || 0);
    });

    const prizeWinners = sortedUsers.slice(0, 3);
    const prizes = [50, 30, 10];

    const batch = writeBatch(db);

    prizeWinners.forEach((winner, index) => {
        const userRef = doc(db, 'users', winner.id);
        batch.update(userRef, { balance: increment(prizes[index]) });
    });

    if (prizeWinners.length > 0) {
        await batch.commit().catch(error => {
            console.error("Error awarding prizes: ", error);
            throw new Error("Mükafatların verilməsi zamanı xəta baş verdi.");
        });
    }
}

// --- Auth Actions ---
export async function signInUser(email: string, password: string) {
    const auth = getAuth();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw new Error(handleAuthError(error));
    }
}
