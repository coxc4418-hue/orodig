import { db, membersTable, productsTable, purchasesTable, renewalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function test() {
  try {
    console.log("Buscando todos los miembros...");
    const members = await db.select().from(membersTable);
    console.log("Lista de miembros:");
    members.forEach(m => console.log(`- @${m.username} (ID: ${m.id}): Saldo: $${m.balance}, Estado: ${m.referralStatus}`));

    const tomas = members.find(m => m.username === "user_tomas");
    if (tomas) {
      console.log("DETALLES COMPLETOS DE TOMAS:", JSON.stringify(tomas, null, 2));
    } else {
      console.log("No se encontró a user_tomas");
    }

    console.log("Buscando depósitos...");
    const { depositsTable } = await import("@workspace/db");
    const deposits = await db.select().from(depositsTable);
    console.log("Todos los depósitos:");
    deposits.forEach(d => console.log(`- ID: ${d.id}, MemberId: ${d.memberId}, Amount: ${d.amount}, Status: ${d.status}`));

    if (members.length === 0) {
      console.log("No hay miembros en la base de datos.");
      return;
    }
    const member = tomas || members[0];
    console.log("Miembro seleccionado para prueba:", member.username, "Saldo:", member.balance);

    console.log("Busco el producto Gran Líder...");
    const [product] = await db.select().from(productsTable).where(eq(productsTable.name, "Gran Líder"));
    if (!product) {
      console.log("Producto 'Gran Líder' no encontrado.");
      return;
    }
    console.log("Producto encontrado:", product);

    const totalPrice = parseFloat(product.price);
    const pointsEarned = parseFloat(product.pointsReward);

    console.log(`Intentando insertar compra para miembro ${member.id}...`);
    const [purchase] = await db.insert(purchasesTable).values({
      memberId: member.id,
      productId: product.id,
      quantity: 1,
      totalPrice: totalPrice.toString(),
      pointsEarned: pointsEarned.toString(),
    }).returning();

    console.log("Compra insertada con éxito:", purchase);
  } catch (error) {
    console.error("ERROR DETECTADO:", error);
  }
}

test();
