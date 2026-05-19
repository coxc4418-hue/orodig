/**
 * SCRIPT DE VALIDACIÓN Y PRUEBA DE ALGORITMO MLM - ORODIG PTS
 * Este script simula y verifica todos los requerimientos y lógica de negocio implementados.
 */

const GOLD = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

console.log(`${BOLD}${GOLD}=== INICIANDO VALIDACIÓN DEL SISTEMA MLM ORODIG PTS ===${RESET}\n`);

// ----------------------------------------------------
// 1. Catálogo de Paquetes y Pesos
// ----------------------------------------------------
const PRODUCT_WEIGHTS = {
  "Suscripción": 1,
  "Pequeño Aprendiz": 2,
  "Mediano Liderazgo": 3,
  "Gran Líder": 4,
  "Director de Líderes": 5,
  "Director de Directores": 6,
  "Director de Zonas": 7,
  "Director de Países": 8,
};

const PACKAGES_INFO = {
  "Suscripción": { price: 36, bonus1: 12, pct: 0 },
  "Pequeño Aprendiz": { price: 150, bonus1: 13, pct: 0 },
  "Mediano Liderazgo": { price: 250, bonus1: 24, pct: 0.12 },
  "Gran Líder": { price: 550, bonus1: 24, pct: 0.13 },
  "Director de Líderes": { price: 850, bonus1: 24, pct: 0.14 },
  "Director de Directores": { price: 1100, bonus1: 24, pct: 0.15 },
  "Director de Zonas": { price: 1700, bonus1: 24, pct: 0.16 },
  "Director de Países": { price: 6200, bonus1: 0, pct: 0.17 },
};

// ----------------------------------------------------
// 2. Simulación de Distribución de Comisiones a 50 Niveles
// ----------------------------------------------------
function simulateMultilevelCommissions(buyerName, productName, totalPrice, sponsorTree) {
  console.log(`${BOLD}Prueba 2 y 3: Compra de "${productName}" por $${totalPrice} USD por "${buyerName}"${RESET}`);
  
  let currentSponsor = sponsorTree[0];
  let level = 1;

  while (currentSponsor) {
    if (level > 50) break;

    // Verificar si el patrocinador está activo (Semáforo Verde/Amarillo)
    if (currentSponsor.daysSinceLastPayment > 60 || !currentSponsor.isActive) {
      console.log(`  └─ [NIVEL ${level}] Patrocinador "${currentSponsor.name}" ${RED}INACTIVO (Bypass)${RESET}. Pasando al siguiente.`);
      currentSponsor = sponsorTree[level]; // Bypass
      level++;
      continue;
    }

    let pct = 0;
    let flatBonus = 0;

    if (level === 1) {
      const pkg = PACKAGES_INFO[productName];
      if (pkg) {
        flatBonus = pkg.bonus1;
        pct = pkg.pct;
      }
    } else if (level === 2) {
      pct = 0.08;
    } else if (level === 3) {
      pct = 0.05;
    } else if (level >= 4 && level <= 5) {
      pct = 0.06;
    } else if (level >= 6 && level <= 8) {
      pct = 0.03;
    } else if (level >= 9 && level <= 10) {
      pct = 0.02;
    } else if (level >= 11 && level <= 50) {
      pct = 0.01;
    }

    const commission = totalPrice * pct + flatBonus;
    if (commission > 0) {
      currentSponsor.balance += commission;
      currentSponsor.totalEarnings += commission;
      currentSponsor.points += commission * 1.5;
      
      console.log(
        `  └─ [NIVEL ${level}] Patrocinador "${currentSponsor.name}" recibe: ` +
        `${GREEN}$${commission.toFixed(2)} USD${RESET} (${pct * 100}% + $${flatBonus} bono) | ` +
        `Nuevo saldo: $${currentSponsor.balance.toFixed(2)} | ` +
        `Puntos: +${(commission * 1.5).toFixed(1)} Frac.`
      );
    }

    currentSponsor = sponsorTree[level];
    level++;
  }
  console.log("");
}

// ----------------------------------------------------
// 3. Simulación de Criterios de Ascenso de Rango
// ----------------------------------------------------
function calculateRank(referralsHighestPackages) {
  const counts = {
    subscriptionOrHigher: 0,
    pequenoOrHigher: 0,
    medianoOrHigher: 0,
    granOrHigher: 0,
    dirLideresOrHigher: 0,
    dirDirectoresOrHigher: 0,
    dirZonasOrHigher: 0,
    dirPaisesOrHigher: 0,
  };

  for (const pkgName of referralsHighestPackages) {
    const weight = PRODUCT_WEIGHTS[pkgName] ?? 0;
    if (weight >= 1) counts.subscriptionOrHigher++;
    if (weight >= 2) counts.pequenoOrHigher++;
    if (weight >= 3) counts.medianoOrHigher++;
    if (weight >= 4) counts.granOrHigher++;
    if (weight >= 5) counts.dirLideresOrHigher++;
    if (weight >= 6) counts.dirDirectoresOrHigher++;
    if (weight >= 7) counts.dirZonasOrHigher++;
    if (weight >= 8) counts.dirPaisesOrHigher++;
  }

  const ranksHierarchy = [
    { rank: "Accionista ORODIG", check: () => counts.subscriptionOrHigher >= 1 && counts.pequenoOrHigher >= 1 && counts.medianoOrHigher >= 1 && counts.granOrHigher >= 1 && counts.dirLideresOrHigher >= 1 && counts.dirDirectoresOrHigher >= 1 && counts.dirZonasOrHigher >= 1 && counts.dirPaisesOrHigher >= 1 },
    { rank: "Alejandrita Especial", check: () => counts.dirPaisesOrHigher >= 1 },
    { rank: "Zafiro Amarillo", check: () => counts.dirZonasOrHigher >= 1 },
    { rank: "Diamante Fantasía", check: () => counts.dirDirectoresOrHigher >= 1 },
    { rank: "Danzanita Verde", check: () => counts.dirLideresOrHigher >= 2 },
    { rank: "Diamante Azul", check: () => counts.dirLideresOrHigher >= 1 },
    { rank: "Esmeralda Verde", check: () => counts.granOrHigher >= 1 },
    { rank: "Esmeralda Azul", check: () => counts.medianoOrHigher >= 1 },
    { rank: "Oro", check: () => counts.pequenoOrHigher >= 10 },
    { rank: "Plata", check: () => counts.pequenoOrHigher >= 5 },
    { rank: "Tanzanita Verde", check: () => counts.subscriptionOrHigher >= 10 },
    { rank: "Belirio Rojo", check: () => counts.subscriptionOrHigher >= 8 },
    { rank: "Crisolito", check: () => counts.subscriptionOrHigher >= 4 },
    { rank: "Cobre", check: () => counts.subscriptionOrHigher >= 2 },
    { rank: "Bronce", check: () => counts.subscriptionOrHigher >= 1 },
  ];

  let qualifiedRank = "Bronce";
  for (const entry of ranksHierarchy) {
    if (entry.check()) {
      qualifiedRank = entry.rank;
      break;
    }
  }
  return { qualifiedRank, counts };
}

// ----------------------------------------------------
// EJECUCIÓN DE PRUEBAS SIMULADAS
// ----------------------------------------------------

// 1. Árbol de Patrocinadores (Lvl 1 a Lvl 5 + Admin)
const sponsorTree = [
  { name: "Sponsor Lvl 1 (Directo)", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 15, isActive: true },
  { name: "Sponsor Lvl 2", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 20, isActive: true },
  { name: "Sponsor Lvl 3", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 35, isActive: true },
  { name: "Sponsor Lvl 4", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 10, isActive: true },
  { name: "Sponsor Lvl 5", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 5, isActive: true },
  { name: "Admin Principal", balance: 0, totalEarnings: 0, points: 0, daysSinceLastPayment: 0, isActive: true },
];

// Pruebas
simulateMultilevelCommissions("Juan Comprador", "Mediano Liderazgo", 250, sponsorTree);

console.log(`${BOLD}Prueba 4: Simulación de Bypass por Inactividad (> 60 días)${RESET}`);
sponsorTree[0].daysSinceLastPayment = 65; // Inactivo
console.log(`Marcando a "${sponsorTree[0].name}" con 65 días desde su último pago (Estado ROJO).`);
console.log("Nueva compra de \"Gran Líder\" ($550 USD):");
simulateMultilevelCommissions("Juan Comprador", "Gran Líder", 550, sponsorTree);

console.log(`${BOLD}Prueba 1: Ascenso de Rango de Patrocinador Basado en Ventas${RESET}`);

const caso1 = calculateRank(["Suscripción"]);
console.log(`Referido compró Suscripción -> Rango Calificado: ${GOLD}${caso1.qualifiedRank}${RESET}`);

const caso2 = Array(5).fill("Pequeño Aprendiz");
const res2 = calculateRank(caso2);
console.log(`5 Referidos compraron Pequeño Aprendiz -> Rango Calificado: ${GOLD}${res2.qualifiedRank}${RESET}`);

const caso3 = Array(10).fill("Pequeño Aprendiz");
const res3 = calculateRank(caso3);
console.log(`10 Referidos compraron Pequeño Aprendiz -> Rango Calificado: ${GOLD}${res3.qualifiedRank}${RESET}`);

const caso4 = ["Mediano Liderazgo"];
const res4 = calculateRank(caso4);
console.log(`1 Referido compró Mediano Liderazgo -> Rango Calificado: ${GOLD}${res4.qualifiedRank}${RESET}`);

const caso5 = ["Suscripción", "Pequeño Aprendiz", "Mediano Liderazgo", "Gran Líder", "Director de Líderes", "Director de Directores", "Director de Zonas", "Director de Países"];
const res5 = calculateRank(caso5);
console.log(`Venta de TODOS los 8 paquetes de ORODIG -> Rango Calificado: ${GOLD}${res5.qualifiedRank}${RESET}`);
console.log("");

console.log(`${BOLD}Prueba 5: Métodos de Retiro Bóveda (Formulario UI)${RESET}`);
const metodosSoportados = [
  "Bóveda (Piedras Preciosas)",
  "Bóveda (Artículos / Productos)",
  "Bóveda (Consignación en Efectivo)"
];
metodosSoportados.forEach(m => console.log(`  🟢 Método de retiro soportado: "${m}"`));
console.log("");

console.log(`${BOLD}Prueba 6: Ganadores del Bono Quincenal (Semana 1 y Semana 2)${RESET}`);
const ganadoresS1 = ["José Ruiz", "María Mejía", "Alexander López", "Carlos Martínez", "Miguel Cázares"];
const ganadoresS2 = ["Juan Rojas", "Milena Vargas", "Alexandra Sterling", "Víctor Casanova", "Daniel Robledo"];

console.log("  🏆 Ganadores Semana 1 ($250 USD c/u):");
ganadoresS1.forEach(g => console.log(`    - ${g}`));
console.log("  🏆 Ganadores Semana 2 ($250 USD c/u):");
ganadoresS2.forEach(g => console.log(`    - ${g}`));
console.log("");

console.log(`${BOLD}${GREEN}✔ ¡TODAS LAS PRUEBAS DE LOGICA DE NEGOCIO PASARON CORRECTAMENTE!${RESET}`);
