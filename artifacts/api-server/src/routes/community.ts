import { Router, type IRouter } from "express";
import { db, membersTable, postsTable, postCommentsTable, followsTable, conferencesTable, firestore } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { z } from "zod";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore/lite";

const router: IRouter = Router();

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getMemberMini(id: number) {
  const [m] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!m) return null;
  return { id: m.id, username: m.username, fullName: m.fullName, avatarUrl: m.avatarUrl ?? null, rank: m.rank };
}

// ─── POSTS ──────────────────────────────────────────────────────────────────

// GET /community/feed — paginated posts (newest first)
router.get("/community/feed", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const memberId = req.memberId!;
  const snap = await getDocs(query(collection(firestore, "posts"), orderBy("createdAt", "desc"), limit(50)));
  const posts: any[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const author = await getMemberMini(data.memberId);
    const likedBy: number[] = data.likedBy ?? [];
    posts.push({
      id: data.id,
      memberId: data.memberId,
      author,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      likesCount: data.likesCount ?? 0,
      commentsCount: data.commentsCount ?? 0,
      likedByMe: likedBy.includes(memberId),
      createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt?.seconds * 1000 || Date.now()).toISOString(),
    });
  }
  res.json(posts);
});

const CreatePostBody = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().nullable().optional(),
});


// POST /community/posts — create a post
router.post("/community/posts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const memberId = req.memberId!;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const snap = await getDocs(query(collection(firestore, "counters")));
  let postCounterRef = doc(firestore, "counters", "posts");
  const counterDoc = await getDoc(postCounterRef);
  const nextId = counterDoc.exists() ? (counterDoc.data().current ?? 0) + 1 : 1;
  await setDoc(postCounterRef, { current: nextId });

  const postRef = doc(firestore, "posts", nextId.toString());
  const now = new Date();
  const postData = {
    id: nextId,
    memberId,
    content: parsed.data.content,
    imageUrl: parsed.data.imageUrl ?? null,
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(postRef, postData);

  const author = await getMemberMini(memberId);
  res.status(201).json({ ...postData, author, likedByMe: false, createdAt: now.toISOString() });
});

// DELETE /community/posts/:id — delete own post
router.delete("/community/posts/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const memberId = req.memberId!;
  const postRef = doc(firestore, "posts", id.toString());
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) { res.status(404).json({ error: "Post no encontrado" }); return; }
  const data = postDoc.data();
  const isAdmin = (await getMemberMini(memberId))?.username === "admin";
  if (data.memberId !== memberId && !isAdmin) { res.status(403).json({ error: "Sin permisos" }); return; }
  const { deleteDoc } = await import("firebase/firestore/lite");
  await deleteDoc(postRef);
  // Also delete comments
  const commentsSnap = await getDocs(query(collection(firestore, "post_comments"), where("postId", "==", id)));
  for (const cd of commentsSnap.docs) { await deleteDoc(cd.ref); }
  res.json({ success: true });
});

// POST /community/posts/:id/like — toggle like
router.post("/community/posts/:id/like", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const memberId = req.memberId!;
  const postRef = doc(firestore, "posts", id.toString());
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) { res.status(404).json({ error: "Post no encontrado" }); return; }
  const data = postDoc.data();
  const likedBy: number[] = data.likedBy ?? [];
  const alreadyLiked = likedBy.includes(memberId);
  if (alreadyLiked) {
    await updateDoc(postRef, { likedBy: arrayRemove(memberId), likesCount: Math.max((data.likesCount ?? 0) - 1, 0) });
  } else {
    await updateDoc(postRef, { likedBy: arrayUnion(memberId), likesCount: (data.likesCount ?? 0) + 1 });
  }
  res.json({ liked: !alreadyLiked, likesCount: alreadyLiked ? Math.max((data.likesCount ?? 0) - 1, 0) : (data.likesCount ?? 0) + 1 });
});

// GET /community/posts/:id/comments
router.get("/community/posts/:id/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const snap = await getDocs(query(collection(firestore, "post_comments"), where("postId", "==", id)));
  const comments: any[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const author = await getMemberMini(data.memberId);
    comments.push({
      id: data.id,
      postId: data.postId,
      memberId: data.memberId,
      author,
      content: data.content,
      createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt?.seconds * 1000 || Date.now()).toISOString(),
    });
  }
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(comments);
});

const CreateCommentBody = z.object({ content: z.string().min(1).max(1000) });

// POST /community/posts/:id/comments — add comment
router.post("/community/posts/:id/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const memberId = req.memberId!;
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const postRef = doc(firestore, "posts", id.toString());
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) { res.status(404).json({ error: "Post no encontrado" }); return; }

  const counterRef = doc(firestore, "counters", "post_comments");
  const counterDoc = await getDoc(counterRef);
  const nextId = counterDoc.exists() ? (counterDoc.data().current ?? 0) + 1 : 1;
  const { setDoc } = await import("firebase/firestore/lite");
  await setDoc(counterRef, { current: nextId });

  const now = new Date();
  const commentRef = doc(firestore, "post_comments", nextId.toString());
  const commentData = { id: nextId, postId: id, memberId, content: parsed.data.content, createdAt: now, updatedAt: now };
  await setDoc(commentRef, commentData);
  await updateDoc(postRef, { commentsCount: (postDoc.data().commentsCount ?? 0) + 1 });

  const author = await getMemberMini(memberId);
  res.status(201).json({ ...commentData, author, createdAt: now.toISOString() });
});

// DELETE /community/posts/:postId/comments/:id
router.delete("/community/posts/:postId/comments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const commentId = parseInt(req.params.id as string, 10);
  const postId = parseInt(req.params.postId as string, 10);
  const memberId = req.memberId!;
  const commentRef = doc(firestore, "post_comments", commentId.toString());
  const commentDoc = await getDoc(commentRef);
  if (!commentDoc.exists()) { res.status(404).json({ error: "Comentario no encontrado" }); return; }
  const data = commentDoc.data();
  const isAdmin = (await getMemberMini(memberId))?.username === "admin";
  if (data.memberId !== memberId && !isAdmin) { res.status(403).json({ error: "Sin permisos" }); return; }
  const { deleteDoc } = await import("firebase/firestore/lite");
  await deleteDoc(commentRef);
  const postRef = doc(firestore, "posts", postId.toString());
  const postDoc = await getDoc(postRef);
  if (postDoc.exists()) {
    await updateDoc(postRef, { commentsCount: Math.max((postDoc.data().commentsCount ?? 0) - 1, 0) });
  }
  res.json({ success: true });
});

// ─── FOLLOWS ─────────────────────────────────────────────────────────────────

// GET /community/members/:id/profile — social profile of a member
router.get("/community/members/:id/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!member) { res.status(404).json({ error: "Miembro no encontrado" }); return; }

  const followersSnap = await getDocs(query(collection(firestore, "follows"), where("followingId", "==", id)));
  const followingSnap = await getDocs(query(collection(firestore, "follows"), where("followerId", "==", id)));
  const postsSnap = await getDocs(query(collection(firestore, "posts"), where("memberId", "==", id)));

  const viewerId = req.memberId!;
  const isFollowing = followersSnap.docs.some(d => d.data().followerId === viewerId);

  res.json({
    id: member.id,
    username: member.username,
    fullName: member.fullName,
    avatarUrl: member.avatarUrl ?? null,
    rank: member.rank,
    totalEarnings: parseFloat(member.totalEarnings),
    directReferrals: member.directReferrals,
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
    postsCount: postsSnap.size,
    isFollowing,
  });
});

// POST /community/follow/:id — toggle follow
router.post("/community/follow/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const followingId = parseInt(req.params.id as string, 10);
  const followerId = req.memberId!;
  if (followerId === followingId) { res.status(400).json({ error: "No puedes seguirte a ti mismo" }); return; }

  const existingSnap = await getDocs(query(
    collection(firestore, "follows"),
    where("followerId", "==", followerId),
    where("followingId", "==", followingId)
  ));

  const { deleteDoc, setDoc } = await import("firebase/firestore/lite");
  if (!existingSnap.empty) {
    for (const d of existingSnap.docs) await deleteDoc(d.ref);
    res.json({ following: false });
    return;
  }

  const counterRef = doc(firestore, "counters", "follows");
  const counterDoc = await getDoc(counterRef);
  const nextId = counterDoc.exists() ? (counterDoc.data().current ?? 0) + 1 : 1;
  await setDoc(counterRef, { current: nextId });
  const now = new Date();
  await setDoc(doc(firestore, "follows", nextId.toString()), {
    id: nextId, followerId, followingId, createdAt: now, updatedAt: now
  });
  res.json({ following: true });
});

// ─── CONFERENCES ─────────────────────────────────────────────────────────────

// GET /community/conferences — list conferences
router.get("/community/conferences", requireAuth, async (_req, res): Promise<void> => {
  const snap = await getDocs(query(collection(firestore, "conferences"), orderBy("createdAt", "desc")));
  const conferences = snap.docs.map(d => {
    const data = d.data();
    return {
      id: data.id,
      title: data.title,
      description: data.description ?? "",
      streamUrl: data.streamUrl ?? "",
      isLive: data.isLive ?? false,
      scheduledAt: data.scheduledAt ? (data.scheduledAt instanceof Date ? data.scheduledAt.toISOString() : new Date(data.scheduledAt?.seconds * 1000).toISOString()) : null,
      endedAt: data.endedAt ? (data.endedAt instanceof Date ? data.endedAt.toISOString() : new Date(data.endedAt?.seconds * 1000).toISOString()) : null,
      chatMessages: data.chatMessages ?? [],
      createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt?.seconds * 1000 || Date.now()).toISOString(),
    };
  });
  res.json(conferences);
});

const ConferenceBody = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  streamUrl: z.string().optional().default(""),
  isLive: z.boolean().optional().default(false),
  scheduledAt: z.string().datetime().nullable().optional(),
});

const ConferenceUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  streamUrl: z.string().optional(),
  isLive: z.boolean().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  chatMessage: z.object({ memberId: z.number(), username: z.string(), content: z.string() }).optional(),
});

// POST /community/conferences — create
router.post("/community/conferences", requireAuth, async (_req, res): Promise<void> => {
  const req = _req as AuthRequest;
  const parsed = ConferenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const memberId = req.memberId!;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const isAdmin = member.username === "admin";
  const hasActivePlan = member.referralStatus !== "ROJO" || member.activatedAt !== null || member.rank !== "Bronce";

  if (!isAdmin && !hasActivePlan) {
    res.status(403).json({ error: "Debes tener un plan activo para transmitir en vivo." });
    return;
  }

  const { setDoc } = await import("firebase/firestore/lite");
  const counterRef = doc(firestore, "counters", "conferences");
  const counterDoc = await getDoc(counterRef);
  const nextId = counterDoc.exists() ? (counterDoc.data().current ?? 0) + 1 : 1;
  await setDoc(counterRef, { current: nextId });

  const now = new Date();
  const confData = {
    id: nextId,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    streamUrl: parsed.data.streamUrl ?? "",
    isLive: parsed.data.isLive,
    hostUsername: member.username,
    chatMessages: [],
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(firestore, "conferences", nextId.toString()), confData);
  res.status(201).json({ ...confData, scheduledAt: confData.scheduledAt?.toISOString() ?? null, endedAt: null, createdAt: now.toISOString() });
});

// PATCH /community/conferences/:id — update (admin only or chat message)
router.patch("/community/conferences/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const memberId = req.memberId!;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const confRef = doc(firestore, "conferences", id.toString());
  const confDoc = await getDoc(confRef);
  if (!confDoc.exists()) { res.status(404).json({ error: "Conferencia no encontrada" }); return; }

  const parsed = ConferenceUpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const isAdmin = member.username === "admin";
  const update: any = { updatedAt: new Date() };

  if (parsed.data.chatMessage) {
    // Any authenticated member can send a chat message
    const msg = {
      ...parsed.data.chatMessage,
      memberId,
      username: member.username,
      fullName: member.fullName,
      sentAt: new Date().toISOString(),
    };
    await updateDoc(confRef, { chatMessages: arrayUnion(msg), updatedAt: new Date() });
    res.json({ success: true, message: msg });
    return;
  }

  const isHost = confDoc.data().hostUsername === member.username;
  if (!isAdmin && !isHost) { res.status(403).json({ error: "Solo el anfitrión o el administrador pueden modificar conferencias" }); return; }

  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.streamUrl !== undefined) update.streamUrl = parsed.data.streamUrl;
  if (parsed.data.isLive !== undefined) update.isLive = parsed.data.isLive;
  if (parsed.data.scheduledAt !== undefined) update.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  if (parsed.data.endedAt !== undefined) update.endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt) : null;

  await updateDoc(confRef, update);
  const updated = (await getDoc(confRef)).data()!;
  res.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    streamUrl: updated.streamUrl,
    isLive: updated.isLive,
    scheduledAt: updated.scheduledAt ? new Date(updated.scheduledAt?.seconds * 1000).toISOString() : null,
    endedAt: updated.endedAt ? new Date(updated.endedAt?.seconds * 1000).toISOString() : null,
    chatMessages: updated.chatMessages ?? [],
    createdAt: new Date(updated.createdAt?.seconds * 1000).toISOString(),
  });
});

// DELETE /community/conferences/:id (admin only)
router.delete("/community/conferences/:id", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const id = parseInt((_req as any).params.id, 10);
  const { deleteDoc } = await import("firebase/firestore/lite");
  const confRef = doc(firestore, "conferences", id.toString());
  const confDoc = await getDoc(confRef);
  if (!confDoc.exists()) { res.status(404).json({ error: "Conferencia no encontrada" }); return; }
  await deleteDoc(confRef);
  res.json({ success: true });
});

const SEED_PRIZES = [
  {
    id: 1,
    name: "Moto",
    emoji: "🏍️",
    imageUrl: "",
    fracciones: 300000,
    description: "Moto de alta gama financiada por ORODIG PTS para los mejores líderes.",
    color: "from-orange-500/20 to-amber-500/10",
    borderColor: "border-orange-500/30",
    accentColor: "#f97316",
    isSpecial: false
  },
  {
    id: 2,
    name: "Carro",
    emoji: "🚗",
    imageUrl: "",
    fracciones: 900000,
    description: "Vehículo deportivo financiado para los líderes más destacados de la plataforma.",
    color: "from-red-500/20 to-rose-500/10",
    borderColor: "border-red-500/30",
    accentColor: "#ef4444",
    isSpecial: false
  },
  {
    id: 3,
    name: "Casa de Lujo",
    emoji: "🏠",
    imageUrl: "",
    fracciones: 2000000,
    description: "Casa de lujo con 1 baño, 1 cocina, 1 sala y 2 cuartos. Premio exclusivo ORODIG PTS.",
    color: "from-purple-500/20 to-violet-500/10",
    borderColor: "border-purple-500/30",
    accentColor: "#a855f7",
    isSpecial: false
  },
  {
    id: 4,
    name: "Viaje Exclusivo",
    emoji: "✈️",
    imageUrl: "",
    fracciones: 0,
    description: "Todo gratis × 3 días y 2 noches. Incluye comidas, hospedaje, refrigerios y transporte. Será un paseo inolvidable.",
    color: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    accentColor: "#3b82f6",
    isSpecial: true
  }
];

// GET /community/prizes
router.get("/community/prizes", async (req, res): Promise<void> => {
  try {
    const prizesCol = collection(firestore, "prizes");
    const snapshot = await getDocs(prizesCol);
    let prizes = snapshot.docs.map(doc => doc.data());
    
    if (prizes.length === 0) {
      const { setDoc } = await import("firebase/firestore/lite");
      for (const prize of SEED_PRIZES) {
        await setDoc(doc(firestore, "prizes", prize.id.toString()), prize);
      }
      prizes = SEED_PRIZES;
    }
    
    prizes.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    res.json(prizes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/prizes (create or update, admin only)
router.post("/community/prizes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { setDoc } = await import("firebase/firestore/lite");
    const data = req.body;
    let prizeId = data.id;

    if (!prizeId) {
      const prizesCol = collection(firestore, "prizes");
      const snapshot = await getDocs(prizesCol);
      const existing = snapshot.docs.map(doc => doc.data());
      prizeId = existing.length > 0 ? Math.max(...existing.map(p => p.id ?? 0)) + 1 : 1;
    }

    const prizeData = {
      id: parseInt(prizeId.toString(), 10),
      name: data.name || "Premio",
      emoji: data.emoji || "🎁",
      imageUrl: data.imageUrl || "",
      fracciones: parseInt(data.fracciones?.toString() || "0", 10),
      description: data.description || "",
      color: data.color || "from-amber-500/20 to-yellow-500/10",
      borderColor: data.borderColor || "border-amber-500/30",
      accentColor: data.accentColor || "#eab308",
      isSpecial: !!data.isSpecial,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(firestore, "prizes", prizeData.id.toString()), prizeData);
    res.status(200).json(prizeData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /community/prizes/:id (admin only)
router.delete("/community/prizes/:id", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const id = parseInt((_req as any).params.id, 10);
    const { deleteDoc } = await import("firebase/firestore/lite");
    const prizeRef = doc(firestore, "prizes", id.toString());
    const prizeDoc = await getDoc(prizeRef);
    if (!prizeDoc.exists()) { res.status(404).json({ error: "Premio no encontrado" }); return; }
    await deleteDoc(prizeRef);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
