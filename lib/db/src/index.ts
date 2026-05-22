import { Timestamp } from "firebase/firestore/lite";
import * as schema from "./schema";
import { getFirestoreBackend, firestore } from "./firestoreBackend.js";

const fs = getFirestoreBackend();
const {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
} = fs;

// Simple auto-increment counters helper using transaction
async function getNextId(tableName: string): Promise<number> {
  const counterRef = doc(firestore, "counters", tableName);
  let nextId = 1;
  await runTransaction(firestore, async (transaction: { get: (ref: unknown) => Promise<{ exists: () => boolean; data: () => { current?: number } }>; update: (ref: unknown, data: object) => void; set: (ref: unknown, data: object) => void }) => {
    const snap = await transaction.get(counterRef);
    if (snap.exists()) {
      nextId = (snap.data().current ?? 0) + 1;
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

const COLUMN_MAP: Record<string, string> = {
  firebase_uid: "firebaseUid",
  full_name: "fullName",
  referral_code: "referralCode",
  sponsor_id: "sponsorId",
  avatar_url: "avatarUrl",
  last_payment_at: "lastPaymentAt",
  referral_status: "referralStatus",
  activated_at: "activatedAt",
  expires_at: "expiresAt",
  last_repurchase_at: "lastRepurchaseAt",
  created_at: "createdAt",
  updated_at: "updatedAt",
  direct_referrals: "directReferrals",
  total_network: "totalNetwork",
  is_active: "isActive",
  member_id: "memberId",
  purchase_id: "purchaseId",
  renewed_at: "renewedAt",
  previous_expiration: "previousExpiration",
  new_expiration: "newExpiration",
  product_id: "productId",
  product_name: "productName",
  total_price: "totalPrice",
  points_earned: "pointsEarned",
  source_member_id: "sourceMemberId",
  account_details: "accountDetails",
  reference_number: "referenceNumber",
  // posts
  liked_by: "likedBy",
  likes_count: "likesCount",
  comments_count: "commentsCount",
  image_url: "imageUrl",
  // post_comments
  post_id: "postId",
  // follows
  follower_id: "followerId",
  following_id: "followingId",
  // conferences
  stream_url: "streamUrl",
  is_live: "isLive",
  scheduled_at: "scheduledAt",
  ended_at: "endedAt",
  chat_messages: "chatMessages",
};

function translateFieldName(name: string): string {
  return COLUMN_MAP[name] || name;
}

function parseCondition(cond: any): any {
  if (!cond) return null;
  
  // Custom simple condition objects
  if (cond.type === "eq" || cond.type === "in") {
    return cond;
  }

  // Drizzle Eq / BinaryOperator / SQL class
  if (cond.queryChunks && Array.isArray(cond.queryChunks)) {
    let fieldName: string | null = null;
    let singleVal: any = undefined;
    const arrayVals: any[] = [];
    let hasInOperator = false;

    for (const chunk of cond.queryChunks) {
      if (chunk && typeof chunk === "object") {
        // If it is a Drizzle column representation
        if (chunk.name && (chunk.table || chunk.columnType)) {
          fieldName = translateFieldName(chunk.name);
        }
        // If it is a Param chunk
        else if (chunk.value !== undefined) {
          if (Array.isArray(chunk.value)) {
            arrayVals.push(...chunk.value);
            hasInOperator = true;
          } else {
            arrayVals.push(chunk.value);
            singleVal = chunk.value;
          }
        }
      } else if (typeof chunk === "string" && chunk.toUpperCase().includes(" IN ")) {
        hasInOperator = true;
      }
    }

    if (fieldName) {
      if (hasInOperator || arrayVals.length > 1) {
        return { type: "in", field: fieldName, value: arrayVals };
      }
      if (singleVal !== undefined) {
        return { type: "eq", field: fieldName, value: singleVal };
      }
    }
  }

  // Fallback to legacy Drizzle structure
  if (cond.left && cond.right !== undefined) {
    const fieldName = translateFieldName(cond.left.name || cond.left.mapFromDriverValue || "id");
    const val = cond.right && typeof cond.right === "object" && cond.right.value !== undefined ? cond.right.value : cond.right;
    return { type: "eq", field: fieldName, value: val };
  }

  if (cond.left && cond.values && Array.isArray(cond.values)) {
    const fieldName = translateFieldName(cond.left.name || cond.left.mapFromDriverValue || "id");
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
        this.orderField = translateFieldName(orderClause.expression?.name || "id");
        this.orderDir = orderClause.direction;
      } else if (orderClause.field) {
        this.orderField = translateFieldName(orderClause.field);
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

      const snap = (await getDocs(q)) as { forEach: (fn: (d: { data: () => Record<string, unknown> }) => void) => void };
      let results: any[] = [];
      snap.forEach((d) => {
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

function getTableName(table: any): string {
  if (!table) return "";
  if (typeof table === "string") return table;
  if (table.tableName) return table.tableName;
  
  // Try Drizzle's Symbol(drizzle:Name)
  const symbols = Object.getOwnPropertySymbols(table);
  const nameSymbol = symbols.find(s => s.toString() === "Symbol(drizzle:Name)");
  if (nameSymbol) {
    return table[nameSymbol];
  }
  
  // Try other symbols or keys
  for (const sym of symbols) {
    if (sym.toString().includes("Name") || sym.toString().includes("Table")) {
      return table[sym];
    }
  }
  return "";
}

export const db = {
  select: () => ({
    from: (table: any) => new FirestoreQueryBuilder(getTableName(table))
  }),

  insert: (table: any) => ({
    values: (data: any) => {
      const promise = (async () => {
        const records = Array.isArray(data) ? data : [data];
        const insertedRecords: any[] = [];
        const tName = getTableName(table);
        for (const record of records) {
          const docId = record.id || (await getNextId(tName));
          const docRef = doc(firestore, tName, docId.toString());
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
          const tName = getTableName(table);
          const builder = new FirestoreQueryBuilder(tName);
          if (cond) builder.where(cond);
          const matches = await builder;
          const updatedRecords: any[] = [];
          for (const match of matches) {
            const docRef = doc(firestore, tName, match.id.toString());
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
      const tName = getTableName(table);
      const builder = new FirestoreQueryBuilder(tName);
      if (cond) builder.where(cond);
      const matches = await builder;
      for (const match of matches) {
        const docRef = doc(firestore, tName, match.id.toString());
        await deleteDoc(docRef);
      }
    }
  })
};

// Re-export custom helpers so we are fully robust
export function eq(field: any, value: any) {
  return { type: "eq", field: translateFieldName(field.name), value };
}

export function inArray(field: any, value: any[]) {
  return { type: "in", field: translateFieldName(field.name), value };
}

export function desc(field: any) {
  return { field: translateFieldName(field.name), dir: "desc" };
}

export { getFirestoreBackend, firestore } from "./firestoreBackend.js";
export { getFirebaseClientConfig, isUsingFirebaseAdmin } from "./firebaseConfig.js";
export * from "./schema";
