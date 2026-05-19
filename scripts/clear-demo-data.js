import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import bcrypt from "bcryptjs";

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
const auth = getAuth(app);
const firestore = getFirestore(app);

const PASSWORD = "OroDig2026!";

async function clearAndInitAdmin() {
  console.log("=== INICIANDO RESETEO DE BASE DE DATOS A ABSOLUTO CERO ===");

  try {
    // 1. Limpiar todas las colecciones de Firestore
    const collectionsToClear = ["members", "earnings", "purchases", "withdrawals", "deposits", "renewals"];
    
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(firestore, colName));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      console.log(`✔ Colección '${colName}' limpiada.`);
    }

    // 2. Reiniciar contadores
    const counters = ["members", "earnings", "purchases", "withdrawals", "deposits", "renewals"];
    for (const countName of counters) {
      const initialVal = countName === "members" ? 1 : 0;
      await setDoc(doc(firestore, "counters", countName), { current: initialVal });
      console.log(`✔ Contador de '${countName}' configurado en ${initialVal}.`);
    }

    // 3. Registrar al Administrador en Firebase Auth si no existe
    let firebaseUid = "ADMIN_FIREBASE_UID";
    try {
      console.log("\nRegistrando Administrador en Firebase Authentication...");
      const userCred = await createUserWithEmailAndPassword(auth, "admin@orodig.com", PASSWORD);
      firebaseUid = userCred.user.uid;
      console.log(`✔ Firebase Auth creado (UID: ${firebaseUid})`);
      await signOut(auth);
    } catch (authError) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("ℹ El correo admin@orodig.com ya está registrado en Firebase Auth, se vinculará normalmente.");
      } else {
        console.warn("⚠ Error al registrar en Firebase Auth:", authError.message);
      }
    }

    // 4. Crear documento del Administrador en la colección 'members' de Firestore
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();

    const adminDoc = {
      id: 1,
      firebaseUid,
      username: "admin",
      password: hashedPassword,
      fullName: "Administrador OroDig",
      email: "admin@orodig.com",
      phone: "+573000000000",
      referralCode: "REFADMIN",
      rank: "Bronce",
      balance: 0.0,
      points: 0.0,
      totalEarnings: 0.0,
      directReferrals: 0,
      totalNetwork: 0,
      isActive: true,
      sponsorId: null,
      avatarUrl: null,
      lastPaymentAt: now,
      referralStatus: "VERDE",
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(firestore, "members", "1"), adminDoc);
    console.log("✔ Cuenta de Administrador creada en Firestore (ID: 1).");

    console.log("\n=== BASE DE DATOS RESETEADA CON ÉXITO ===");
    console.log("Usuario Admin: admin");
    console.log("Correo Admin: admin@orodig.com");
    console.log("Contraseña para entrar: " + PASSWORD);

  } catch (error) {
    console.error("❌ Error durante el reseteo:", error);
    process.exit(1);
  }
}

clearAndInitAdmin();
