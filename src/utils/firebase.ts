import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test as required by skill guidelines
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  bestStunt: string;
  levelName: string;
  bikeName: string;
  coinsCollected?: number;
  userId: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | string;
}

// Fallback seed entries for realistic stunt gaming competition when starting fresh
export const DEFAULT_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'Malik Stunt King',
    score: 28450,
    bestStunt: 'Triple Backflip Combo x4',
    levelName: 'Extreme Stunt Arena',
    bikeName: 'Monster Titan 700',
    coinsCollected: 142,
    userId: 'seed_sys_1',
  },
  {
    id: 'seed-2',
    playerName: 'NitroPhantom',
    score: 21900,
    bestStunt: 'Front Flip + Big Air',
    levelName: 'Desert Dune Jumps',
    bikeName: 'Super Ninja 450',
    coinsCollected: 98,
    userId: 'seed_sys_2',
  },
  {
    id: 'seed-3',
    playerName: 'ApexRider_99',
    score: 17850,
    bestStunt: 'Double Backflip',
    levelName: 'City Rooftop Skyline',
    bikeName: 'Sport Blade 350',
    coinsCollected: 76,
    userId: 'seed_sys_3',
  },
  {
    id: 'seed-4',
    playerName: 'SkyHigh_Pro',
    score: 14600,
    bestStunt: 'Big Air + Wheelie',
    levelName: 'Mountain Lift Gaps',
    bikeName: 'Dirt Jumper Pro',
    coinsCollected: 64,
    userId: 'seed_sys_4',
  },
  {
    id: 'seed-5',
    playerName: 'Vortex_Rider',
    score: 11200,
    bestStunt: 'Smooth Backflip',
    levelName: 'Beginner Green Hills',
    bikeName: 'Motocross TX-250',
    coinsCollected: 48,
    userId: 'seed_sys_5',
  },
  {
    id: 'seed-6',
    playerName: 'StuntBlaze',
    score: 9800,
    bestStunt: 'Double Flip Combo x2',
    levelName: 'Desert Dune Jumps',
    bikeName: 'Dirt Jumper Pro',
    coinsCollected: 35,
    userId: 'seed_sys_6',
  },
  {
    id: 'seed-7',
    playerName: 'SpeedDemon',
    score: 8450,
    bestStunt: 'Long Wheelie',
    levelName: 'Beginner Green Hills',
    bikeName: 'Motocross TX-250',
    coinsCollected: 30,
    userId: 'seed_sys_7',
  },
  {
    id: 'seed-8',
    playerName: 'TurboRider_X',
    score: 7200,
    bestStunt: 'Front Flip',
    levelName: 'Mountain Lift Gaps',
    bikeName: 'Sport Blade 350',
    coinsCollected: 25,
    userId: 'seed_sys_8',
  },
  {
    id: 'seed-9',
    playerName: 'Racer_Zara',
    score: 6150,
    bestStunt: 'Big Air Jump',
    levelName: 'Beginner Green Hills',
    bikeName: 'Motocross TX-250',
    coinsCollected: 22,
    userId: 'seed_sys_9',
  },
  {
    id: 'seed-10',
    playerName: 'DareDevil_Sam',
    score: 5400,
    bestStunt: 'Air Rotation 360',
    levelName: 'Beginner Green Hills',
    bikeName: 'Motocross TX-250',
    coinsCollected: 18,
    userId: 'seed_sys_10',
  },
];

/**
 * Fetch top 10 highest stunt scores from Firestore
 */
export async function getTopLeaderboardScores(maxLimit = 10): Promise<LeaderboardEntry[]> {
  const collectionPath = 'leaderboard';
  try {
    const q = query(
      collection(db, collectionPath),
      orderBy('score', 'desc'),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_LEADERBOARD_ENTRIES.slice(0, maxLimit);
    }

    const remoteEntries: LeaderboardEntry[] = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        playerName: (data.playerName as string) || 'Anonymous Rider',
        score: Number(data.score) || 0,
        bestStunt: (data.bestStunt as string) || 'Air Flip',
        levelName: (data.levelName as string) || 'Novice Hills',
        bikeName: (data.bikeName as string) || 'Motocross TX-250',
        coinsCollected: Number(data.coinsCollected) || 0,
        userId: (data.userId as string) || '',
        createdAt: data.createdAt,
      };
    });

    // If fewer than maxLimit entries in Firestore, pad with default benchmarks
    if (remoteEntries.length < maxLimit) {
      const existingUserIds = new Set(remoteEntries.map((e) => e.userId));
      const remainingSeeds = DEFAULT_LEADERBOARD_ENTRIES.filter(
        (s) => !existingUserIds.has(s.userId)
      ).slice(0, maxLimit - remoteEntries.length);
      return [...remoteEntries, ...remainingSeeds].sort((a, b) => b.score - a.score);
    }

    return remoteEntries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Submit high score to Firestore
 */
export async function submitStuntScore(params: {
  playerName: string;
  score: number;
  bestStunt: string;
  levelName: string;
  bikeName: string;
  coinsCollected: number;
}): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google to post your stunt score to the Global Leaderboard!');
  }

  const cleanName = params.playerName.trim().slice(0, 32) || 'Rider';
  const cleanScore = Math.max(0, Math.min(10000000, Math.round(params.score)));
  const cleanBestStunt = params.bestStunt.slice(0, 64) || 'Air Flip';
  const cleanLevel = params.levelName.slice(0, 64) || 'Stunt Track';
  const cleanBike = params.bikeName.slice(0, 64) || 'Motocross TX-250';
  const cleanCoins = Math.max(0, Math.min(100000, Math.round(params.coinsCollected)));

  // Generate a valid document ID: safe alphanumeric
  const entryId = `score_${currentUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}_${Date.now()}`;
  const docRef = doc(db, 'leaderboard', entryId);

  try {
    await setDoc(docRef, {
      playerName: cleanName,
      score: cleanScore,
      bestStunt: cleanBestStunt,
      levelName: cleanLevel,
      bikeName: cleanBike,
      coinsCollected: cleanCoins,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    return entryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `leaderboard/${entryId}`);
  }
}

/**
 * Sign in using Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Auth state listener hook helper
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
