import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  runTransaction,
  query,
  where,
  Timestamp
} from "firebase/firestore/lite";
import * as schema from "./schema";

const firebaseConfig = {
  apiKey: "AIzaSyDwZTqFF_-eMJ5lY9TfAEOMJ1ZPvu4lArE",
  authDomain: "oro-dig.firebaseapp.com",
  projectId: "oro-dig",
  storageBucket: "oro-dig.firebasestorage.app",
  messagingSenderId: "179790537406",
  appId: "1:179790537406:web:755c259e274cf1755034ef",
  measurementId: "G-32PM05VNHQ"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

// Simple auto-increment counters helper using transaction
async function getNextId(tableName: string): Promise<number> {
  const counterRef = doc(firestore, "counters", tableName);
  let nextId = 1;
  await runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(counterRef);
    if (snap.exists()) {
      nextId = snap.data().current + 1;
      transaction.update(counterRef, { current: nextId });
    } else {
      transaction.set(counterRef, { current: 1 });
    }
  });
  return nextId;
}

// Convert firestore timestamp or raw values into javascript types
function sanitizeData(data: any): any {
  if (!data) return data;
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] && typeof result[key] === "object") {
      if (result[key] instanceof Timestamp) {
        result[key] = result[key].toDate();
      } else if (typeof result[key].toDate === "function") {
        result[key] = result[key].toDate();
      }
    }
  }
  return result;
}

function parseCondition(cond: any): any {
  if (!cond) return null;
  if (cond.type) return cond;

  // Drizzle Eq / BinaryOperator
  if (cond.left && cond.right !== undefined) {
    const fieldName = cond.left.name || cond.left.mapFromDriverValue || "id";
    return { type: "eq", field: fieldName, value: cond.right };
  }

  // Drizzle InArray
  if (cond.left && cond.values && Array.isArray(cond.values)) {
    const fieldName = cond.left.name || cond.left.mapFromDriverValue || "id";
    return { type: "in", field: fieldName, value: cond.values };
  }

  return null;
}

class FirestoreQueryBuilder {
  private tableName: string;
  private filters: any[] = [];
  private orderField: string | null = null;
  private orderDir: "asc" | "desc" = "asc";
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  where(cond: any) {
    const parsed = parseCondition(cond);
    if (parsed) {
      this.filters.push(parsed);
    }
    return this;
  }

  orderBy(orderClause: any) {
    // Support Drizzle order by desc(table.field)
    if (orderClause) {
      if (orderClause.direction) {
        this.orderField = orderClause.expression?.name || "id";
        this.orderDir = orderClause.direction;
      } else if (orderClause.field) {
        this.orderField = orderClause.field;
        this.orderDir = orderClause.dir || "asc";
      }
    }
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async then(onfulfilled?: (value: any[]) => any) {
    try {
      let q = query(collection(firestore, this.tableName));
      
      // Apply filters if simple
      for (const filter of this.filters) {
        if (filter.type === "eq") {
          q = query(q, where(filter.field, "==", filter.value));
        } else if (filter.type === "in") {
          if (filter.value.length === 0) {
            return onfulfilled ? onfulfilled([]) : [];
          }
          const chunk = filter.value.slice(0, 10);
          q = query(q, where(filter.field, "in", chunk));
        }
      }

      const snap = await getDocs(q);
      let results: any[] = [];
      snap.forEach(d => {
        results.push(sanitizeData(d.data()));
      });

      // Local sorting to avoid Firestore index requirements
      if (this.orderField) {
        results.sort((a, b) => {
          let valA = a[this.orderField!];
          let valB = b[this.orderField!];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          if (valA < valB) return this.orderDir === "asc" ? -1 : 1;
          if (valA > valB) return this.orderDir === "asc" ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      return onfulfilled ? onfulfilled(results) : results;
    } catch (err) {
      console.error(`Error querying collection ${this.tableName}:`, err);
      throw err;
    }
  }
}

export const db = {
  select: () => ({
    from: (table: any) => new FirestoreQueryBuilder(table.tableName)
  }),

  insert: (table: any) => ({
    values: (data: any) => {
      const promise = (async () => {
        const records = Array.isArray(data) ? data : [data];
        const insertedRecords: any[] = [];
        for (const record of records) {
          const docId = record.id || (await getNextId(table.tableName));
          const docRef = doc(firestore, table.tableName, docId.toString());
          const finalRecord = {
            ...record,
            id: docId,
            createdAt: record.createdAt || new Date(),
            updatedAt: record.updatedAt || new Date()
          };
          await setDoc(docRef, finalRecord);
          insertedRecords.push(finalRecord);
        }
        return insertedRecords;
      })();
      
      (promise as any).returning = () => promise;
      return promise as any;
    }
  }),

  update: (table: any) => ({
    set: (updateData: any) => ({
      where: (cond: any) => {
        const promise = (async () => {
          const builder = new FirestoreQueryBuilder(table.tableName);
          if (cond) builder.where(cond);
          const matches = await builder;
          const updatedRecords: any[] = [];
          for (const match of matches) {
            const docRef = doc(firestore, table.tableName, match.id.toString());
            const finalUpdate = { ...updateData, updatedAt: new Date() };
            await updateDoc(docRef, finalUpdate);
            updatedRecords.push({ ...match, ...finalUpdate });
          }
          return updatedRecords;
        })();
        
        (promise as any).returning = () => promise;
        return promise as any;
      }
    })
  }),

  delete: (table: any) => ({
    where: async (cond: any) => {
      const builder = new FirestoreQueryBuilder(table.tableName);
      if (cond) builder.where(cond);
      const matches = await builder;
      for (const match of matches) {
        const docRef = doc(firestore, table.tableName, match.id.toString());
        await deleteDoc(docRef);
      }
    }
  })
};

// Re-export custom helpers so we are fully robust
export function eq(field: any, value: any) {
  return { type: "eq", field: field.name, value };
}

export function inArray(field: any, value: any[]) {
  return { type: "in", field: field.name, value };
}

export function desc(field: any) {
  return { field: field.name, dir: "desc" };
}

export * from "./schema";
