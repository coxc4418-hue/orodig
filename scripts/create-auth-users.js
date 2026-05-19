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

const RANKS_INFO = [
  { username: "admin", email: "admin@orodig.com", fullName: "Administrador OroDig", rank: "Bronce", ref: "REFADMIN" },
  { username: "user_accionista", email: "accionista@orodig.com", fullName: "Socio Accionista", rank: "Accionista ORODIG", ref: "REFACCIONISTA" },
  { username: "user_alejandrita", email: "alejandrita@orodig.com", fullName: "Socio Alejandrita", rank: "Alejandrita Especial", ref: "REFALEJANDRITA" },
  { username: "user_zafiro", email: "zafiro@orodig.com", fullName: "Socio Zafiro", rank: "Zafiro Amarillo", ref: "REFZAFIRO" },
  { username: "user_diamantefantasia", email: "diamantefantasia@orodig.com", fullName: "Socio Diamante Fantasía", rank: "Diamante Fantasía", ref: "REFDIAMANTEFANTASIA" },
  { username: "user_danzanita", email: "danzanita@orodig.com", fullName: "Socio Danzanita", rank: "Danzanita Verde", ref: "REFDANZANITA" },
  { username: "user_diamanteazul", email: "diamanteazul@orodig.com", fullName: "Socio Diamante Azul", rank: "Diamante Azul", ref: "REFDIAMANTEAZUL" },
  { username: "user_esmeraldaverde", email: "esmeraldaverde@orodig.com", fullName: "Socio Esmeralda Verde", rank: "Esmeralda Verde", ref: "REFESMERALDAVERDE" },
  { username: "user_esmeraldaazul", email: "esmeraldaazul@orodig.com", fullName: "Socio Esmeralda Azul", rank: "Esmeralda Azul", ref: "REFESMERALDAAZUL" },
  { username: "user_oro", email: "oro@orodig.com", fullName: "Socio Oro", rank: "Oro", ref: "REFORO" },
  { username: "user_plata", email: "plata@orodig.com", fullName: "Socio Plata", rank: "Plata", ref: "REFPLATA" },
  { username: "user_tanzanita", email: "tanzanita@orodig.com", fullName: "Socio Tanzanita", rank: "Tanzanita Verde", ref: "REFTANZANITA" },
  { username: "user_beliriorojo", email: "beliriorojo@orodig.com", fullName: "Socio Belirio Rojo", rank: "Belirio Rojo", ref: "REFBELIRIOROJO" },
  { username: "user_crisolito", email: "crisolito@orodig.com", fullName: "Socio Crisolito", rank: "Crisolito", ref: "REFCRISOLITO" },
  { username: "user_cobre", email: "cobre@orodig.com", fullName: "Socio Cobre", rank: "Cobre", ref: "REFCOBRE" },
  { username: "user_bronce", email: "bronce@orodig.com", fullName: "Socio Bronce", rank: "Bronce", ref: "REFBRONCE" }
];

async function createUsers() {
  console.log("=== INICIANDO REGISTRO DE USUARIOS EN FIREBASE AUTH Y FIRESTORE ===");

  try {
    // 1. Limpiar miembros y counters de la base de datos
    const snap = await getDocs(collection(firestore, "members"));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    console.log("✔ Colección 'members' limpiada.");

    const snapEarnings = await getDocs(collection(firestore, "earnings"));
    for (const d of snapEarnings.docs) {
      await deleteDoc(d.ref);
    }
    console.log("✔ Colección 'earnings' limpiada.");

    const snapPurchases = await getDocs(collection(firestore, "purchases"));
    for (const d of snapPurchases.docs) {
      await deleteDoc(d.ref);
    }
    console.log("✔ Colección 'purchases' limpiada.");

    const snapWithdrawals = await getDocs(collection(firestore, "withdrawals"));
    for (const d of snapWithdrawals.docs) {
      await deleteDoc(d.ref);
    }
    console.log("✔ Colección 'withdrawals' limpiada.");

    await setDoc(doc(firestore, "counters", "members"), { current: 0 });
    console.log("✔ Contador de miembros inicializado en 0.");

    // Hasp password genérica para guardar en Firestore
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const lastPaymentDate = new Date(); // Estado Verde

    // 2. Registrar cada uno de los usuarios en Firebase Auth y Firestore
    let prevId = null;

    for (let i = 0; i < RANKS_INFO.length; i++) {
      const u = RANKS_INFO[i];
      const memberId = i + 1;

      console.log(`\nCreando usuario [${memberId}/16]: "${u.username}" (${u.email})...`);

      // Crear en Firebase Authentication
      let firebaseUid = "";
      try {
        const userCred = await createUserWithEmailAndPassword(auth, u.email, PASSWORD);
        firebaseUid = userCred.user.uid;
        console.log(`  ✔ Firebase Auth creado (UID: ${firebaseUid})`);
        await signOut(auth); // Desconectar sesión automática del cliente SDK
      } catch (authError) {
        if (authError.code === "auth/email-already-in-use") {
          console.log("  ℹ El correo ya está registrado en Firebase Auth, procediendo con la vinculación Firestore.");
          // No tenemos el UID, generaremos uno ficticio o dejamos vacío para testing
          firebaseUid = "EXISTING_" + u.username.toUpperCase();
        } else {
          console.warn("  ⚠ Error al crear en Firebase Auth:", authError.message);
          firebaseUid = "FAIL_" + u.username.toUpperCase();
        }
      }

      // Crear documento en Firestore members
      const memberDoc = {
        id: memberId,
        firebaseUid,
        username: u.username,
        password: hashedPassword,
        fullName: u.fullName,
        email: u.email,
        phone: "+57300123456" + i,
        referralCode: u.ref,
        rank: u.rank,
        balance: 0.0,
        points: 0.0,
        totalEarnings: 0.0,
        directReferrals: prevId ? 1 : 0,
        totalNetwork: prevId ? (16 - memberId) : 0,
        isActive: true,
        sponsorId: prevId, // Chained network sponsor
        avatarUrl: null,
        lastPaymentAt: lastPaymentDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(firestore, "members", memberId.toString()), memberDoc);
      console.log(`  ✔ Documento de miembro guardado en Firestore (ID: ${memberId}, Patrocinador: ${prevId ?? "Ninguno"})`);

      // El actual se convierte en el patrocinador del siguiente
      prevId = memberId;
    }

    // Actualizar el contador de miembros
    await setDoc(doc(firestore, "counters", "members"), { current: 16 });

    console.log("\n=== REGISTRO DE USUARIOS COMPLETADO CON ÉXITO ===");
    console.log(`Contraseña para todos los usuarios: "${PASSWORD}"`);
  } catch (error) {
    console.error("❌ Error en registro de usuarios:", error);
    process.exit(1);
  }
}

createUsers();
