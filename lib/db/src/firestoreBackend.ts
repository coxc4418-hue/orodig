import { createRequire } from "node:module";
import { getFirebaseClientConfig, isUsingFirebaseAdmin } from "./firebaseConfig.js";

const require = createRequire(import.meta.url);

export type FirestoreBackend = {
  firestore: unknown;
  doc: (...args: unknown[]) => unknown;
  collection: (...args: unknown[]) => unknown;
  getDoc: (...args: unknown[]) => Promise<unknown>;
  getDocs: (...args: unknown[]) => Promise<unknown>;
  setDoc: (...args: unknown[]) => Promise<unknown>;
  updateDoc: (...args: unknown[]) => Promise<unknown>;
  deleteDoc: (...args: unknown[]) => Promise<unknown>;
  query: (...args: unknown[]) => unknown;
  where: (...args: unknown[]) => unknown;
  orderBy: (...args: unknown[]) => unknown;
  limit: (...args: unknown[]) => unknown;
  runTransaction: (...args: unknown[]) => Promise<unknown>;
  arrayUnion: (...args: unknown[]) => unknown;
  arrayRemove: (...args: unknown[]) => unknown;
};

let _backend: FirestoreBackend | null = null;

export function getFirestoreBackend(): FirestoreBackend {
  if (_backend) return _backend;

  if (isUsingFirebaseAdmin()) {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const fs = require("firebase-admin/firestore");
    if (!getApps().length) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)),
        projectId: process.env.FIREBASE_PROJECT_ID || "oro-dig",
      });
    }
    const firestore = fs.getFirestore();
    _backend = {
      firestore,
      doc: fs.doc,
      collection: fs.collection,
      getDoc: fs.getDoc,
      getDocs: fs.getDocs,
      setDoc: fs.setDoc,
      updateDoc: fs.updateDoc,
      deleteDoc: fs.deleteDoc,
      query: fs.query,
      where: fs.where,
      orderBy: fs.orderBy,
      limit: fs.limit,
      runTransaction: fs.runTransaction,
      arrayUnion: (...args: unknown[]) => fs.FieldValue.arrayUnion(...args),
      arrayRemove: (...args: unknown[]) => fs.FieldValue.arrayRemove(...args),
    };
    if (process.env.NODE_ENV === "production") {
      console.info("[db] Firestore: Firebase Admin SDK (server)");
    }
  } else {
    const { initializeApp, getApps } = require("firebase/app");
    const fs = require("firebase/firestore/lite");
    if (!getApps().length) {
      initializeApp(getFirebaseClientConfig());
    }
    const firestore = fs.getFirestore();
    _backend = {
      firestore,
      doc: fs.doc,
      collection: fs.collection,
      getDoc: fs.getDoc,
      getDocs: fs.getDocs,
      setDoc: fs.setDoc,
      updateDoc: fs.updateDoc,
      deleteDoc: fs.deleteDoc,
      query: fs.query,
      where: fs.where,
      orderBy: fs.orderBy,
      limit: fs.limit,
      runTransaction: fs.runTransaction,
      arrayUnion: fs.arrayUnion,
      arrayRemove: fs.arrayRemove,
    };
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[db] FIREBASE_SERVICE_ACCOUNT_JSON not set — using client SDK. Set it on Render and deploy strict Firestore rules.",
      );
    }
  }

  return _backend!;
}

const _fs = getFirestoreBackend();
export const firestore = _fs.firestore;
