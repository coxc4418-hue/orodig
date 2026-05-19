import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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
const firestore = getFirestore(app);

async function checkData() {
  console.log("=== CONSULTANDO FIRESTORE ===");
  
  // 1. Obtener Miembros
  const membersSnap = await getDocs(collection(firestore, "members"));
  membersSnap.forEach(doc => {
    console.log(`Miembro ID: ${doc.id} ->`, doc.data());
  });

  // 2. Obtener Compras
  const purchasesSnap = await getDocs(collection(firestore, "purchases"));
  purchasesSnap.forEach(doc => {
    console.log(`Compra ID: ${doc.id} ->`, doc.data());
  });

  // 3. Obtener Ganancias
  const earningsSnap = await getDocs(collection(firestore, "earnings"));
  earningsSnap.forEach(doc => {
    console.log(`Ganancia ID: ${doc.id} ->`, doc.data());
  });
}

checkData();
