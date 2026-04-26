// Stub for firebase/firestore
const noop = () => {
  throw new Error('Firestore not available in demo build');
};
export const getFirestore = (_a?: any) => null as any;
export const collection = noop as any;
export const doc = noop as any;
export const getDoc = noop as any;
export const getDocs = noop as any;
export const setDoc = noop as any;
export const addDoc = noop as any;
export const updateDoc = noop as any;
export const deleteDoc = noop as any;
export const query = noop as any;
export const where = noop as any;
export const orderBy = noop as any;
export const limit = noop as any;
export const onSnapshot = (() => () => {}) as any;
export const serverTimestamp = noop as any;
export const Timestamp = { now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }) } as any;
export const arrayUnion = noop as any;
export const increment = noop as any;
export type Firestore = any;
