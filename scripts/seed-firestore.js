import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

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

const PRODUCTS = [
  { id: 1, name: "Suscripción", price: "36.00", pointsReward: "54.00", category: "subscriptions", description: "Membresía mensual administrativa básica de suscripción y acceso a la red", isActive: true },
  { id: 2, name: "Pequeño Aprendiz", price: "150.00", pointsReward: "225.00", category: "packages", description: "Paquete inicial Pequeño Aprendiz para adquirir habilidades clave", isActive: true },
  { id: 3, name: "Mediano Liderazgo", price: "250.00", pointsReward: "375.00", category: "packages", description: "Paquete de Mediano Liderazgo para entrenar tu organización", isActive: true },
  { id: 4, name: "Gran Líder", price: "550.00", pointsReward: "825.00", category: "packages", description: "Paquete formativo integral de Gran Líder con privilegios exclusivos", isActive: true },
  { id: 5, name: "Director de Líderes", price: "850.00", pointsReward: "1275.00", category: "packages", description: "Certificación y herramientas avanzadas de Director de Líderes", isActive: true },
  { id: 6, name: "Director de Directores", price: "1100.00", pointsReward: "1650.00", category: "packages", description: "Gestión global de equipos mediante el paquete de Director de Directores", isActive: true },
  { id: 7, name: "Director de Zonas", price: "1700.00", pointsReward: "2550.00", category: "packages", description: "Paquete corporativo de alto impacto de Director de Zonas", isActive: true },
  { id: 8, name: "Director de Países", price: "6200.00", pointsReward: "9300.00", category: "packages", description: "Nivel supremo nacional como Director de Países con comisiones directas", isActive: true }
];

async function seed() {
  console.log("=== INICIANDO SEMBRADO DE PRODUCTOS EN FIRESTORE ===");
  try {
    // 1. Limpiar productos existentes
    const snap = await getDocs(collection(firestore, "products"));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    console.log("✔ Colección 'products' limpiada con éxito.");

    // 2. Insertar productos nuevos
    for (const prod of PRODUCTS) {
      const docRef = doc(firestore, "products", prod.id.toString());
      await setDoc(docRef, prod);
      console.log(`  ➕ Producto agregado: "${prod.name}"`);
    }

    // 3. Inicializar contador de productos en counters
    await setDoc(doc(firestore, "counters", "products"), { current: 8 });
    console.log("✔ Contador de productos configurado en 8.");

    console.log("\n✔ ¡SEMBRADO DE FIRESTORE COMPLETADO SATISFACTORIAMENTE!");
  } catch (error) {
    console.error("❌ Error en sembrado de Firestore:", error);
    process.exit(1);
  }
}

seed();
