// Stub for firebase/app — used when building in DEMO-only mode to avoid
// bundling storage-dependent code that triggers sandbox restrictions.
export const initializeApp = (_cfg: any) => ({}) as any;
export const getApps = () => [] as any[];
export type FirebaseApp = any;
