import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, deleteUser } from "firebase/auth";

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

const PASSWORD = "OroDig2026!";

const SEED_EMAILS = [
  "accionista@orodig.com",
  "alejandrita@orodig.com",
  "zafiro@orodig.com",
  "diamantefantasia@orodig.com",
  "danzanita@orodig.com",
  "diamanteazul@orodig.com",
  "esmeraldaverde@orodig.com",
  "esmeraldaazul@orodig.com",
  "oro@orodig.com",
  "plata@orodig.com",
  "tanzanita@orodig.com",
  "beliriorojo@orodig.com",
  "crisolito@orodig.com",
  "cobre@orodig.com",
  "bronce@orodig.com"
];

async function deleteSeedUsers() {
  console.log("=== INICIANDO ELIMINACIÓN DE USUARIOS DEMO EN FIREBASE AUTH ===");

  for (const email of SEED_EMAILS) {
    try {
      console.log(`Intentando iniciar sesión para: ${email}...`);
      const userCred = await signInWithEmailAndPassword(auth, email, PASSWORD);
      const user = userCred.user;
      
      console.log(`  ✔ Sesión iniciada. Eliminando usuario UID: ${user.uid}...`);
      await deleteUser(user);
      console.log(`  ✔ Usuario ${email} eliminado exitosamente de Firebase Auth.\n`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        console.log(`  ℹ El usuario ${email} no existe en Firebase Auth, omitiendo.\n`);
      } else if (err.code === "auth/invalid-credential") {
        console.log(`  ℹ Credenciales inválidas para ${email} (posiblemente ya fue eliminado).\n`);
      } else {
        console.error(`  ❌ Error al eliminar ${email}:`, err.message, "\n");
      }
    }
  }

  console.log("=== PROCESO DE ELIMINACIÓN FINALIZADO ===");
}

deleteSeedUsers();
