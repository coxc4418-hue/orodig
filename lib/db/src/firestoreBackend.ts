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

function createAdminBackend(): FirestoreBackend {
  const { initializeApp, getApps, cert } = require("firebase-admin/app");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");

  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)),
      projectId: process.env.FIREBASE_PROJECT_ID || "oro-dig",
    });
  }

  const db = getFirestore();

  const doc = (_firestore: unknown, collectionPath: string, docId?: string) => {
    const col = db.collection(collectionPath);
    return docId !== undefined ? col.doc(String(docId)) : col;
  };

  const collection = (_firestore: unknown, collectionPath: string) => db.collection(collectionPath);

  const getDoc = async (ref: any) => {
    const snap = await ref.get();
    return {
      exists: () => snap.exists,
      data: () => snap.data(),
      id: snap.id,
      ref,
    };
  };

  const getDocs = async (queryOrCol: any) => {
    const snap = await queryOrCol.get();
    const docs = snap.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data(),
      ref: d.ref,
      exists: () => d.exists,
    }));
    return {
      docs,
      empty: snap.empty,
      size: snap.size,
      forEach: (fn: (d: (typeof docs)[0]) => void) => docs.forEach(fn),
    };
  };

  const setDoc = async (ref: any, data: unknown, opts?: { merge?: boolean }) => {
    if (opts?.merge) await ref.set(data, { merge: true });
    else await ref.set(data);
  };

  const updateDoc = async (ref: any, data: unknown) => {
    await ref.update(data);
  };

  const deleteDoc = async (ref: any) => {
    await ref.delete();
  };

  const where = (field: string, op: string, value: unknown) => ({ type: "where" as const, field, op, value });
  const orderBy = (field: string, direction?: string) => ({
    type: "orderBy" as const,
    field,
    direction: direction === "desc" ? "desc" : "asc",
  });
  const limit = (count: number) => ({ type: "limit" as const, count });

  const query = (base: any, ...constraints: any[]) => {
    let q: any = base;
    for (const c of constraints) {
      if (c.type === "where" && c.field && c.op) q = q.where(c.field, c.op, c.value);
      if (c.type === "orderBy" && c.field) q = q.orderBy(c.field, c.direction);
      if (c.type === "limit" && c.count !== undefined) q = q.limit(c.count);
    }
    return q;
  };

  const runTransaction = async (_firestore: unknown, fn: (tx: any) => Promise<void>) => {
    return db.runTransaction(async (transaction: any) => {
      const tx = {
        get: async (ref: any) => {
          const snap = await transaction.get(ref);
          return { exists: () => snap.exists, data: () => snap.data() as { current?: number } };
        },
        update: (ref: any, data: unknown) => transaction.update(ref, data),
        set: (ref: any, data: unknown) => transaction.set(ref, data),
      };
      return fn(tx);
    });
  };

  console.info("[db] Firestore: Firebase Admin SDK (server)");

  return {
    firestore: db,
    doc,
    collection,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    runTransaction,
    arrayUnion: (...args: unknown[]) => FieldValue.arrayUnion(...args),
    arrayRemove: (...args: unknown[]) => FieldValue.arrayRemove(...args),
  };
}

function createLiteBackend(): FirestoreBackend {
  const { initializeApp, getApps } = require("firebase/app");
  const fs = require("firebase/firestore/lite");
  if (!getApps().length) {
    initializeApp(getFirebaseClientConfig());
  }
  const firestore = fs.getFirestore();
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[db] FIREBASE_SERVICE_ACCOUNT_JSON not set — using client SDK.",
    );
  }
  return {
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
}

export function getFirestoreBackend(): FirestoreBackend {
  if (!_backend) {
    _backend = isUsingFirebaseAdmin() ? createAdminBackend() : createLiteBackend();
  }
  return _backend;
}

const _fs = getFirestoreBackend();
export const firestore = _fs.firestore;
