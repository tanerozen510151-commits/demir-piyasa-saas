const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function calculateOffer(items, overrideRate = null, vatRate = 20) {
  let exchangeRate = overrideRate;

  // Eğer kullanıcı manuel kur girmediyse, en son USD kurunu al
  if (!exchangeRate) {
    const latestRate = await prisma.exchangeRate.findFirst({
      where: { currency: "USD" },
      orderBy: { date: "desc" },
    });

    if (!latestRate) {
      throw new Error("USD kuru bulunamadı");
    }

    exchangeRate = latestRate.rate;
  }

  let totalNet = 0;
  const calculatedItems = [];

  for (const item of items) {
    let unitPriceTL = item.unitPrice;

    // USD ise TL'ye çevir
    if (item.currency === "USD") {
      unitPriceTL = item.unitPrice * exchangeRate;
    }

    const discount = item.discount || 0;

    const discountedPrice =
      unitPriceTL - (unitPriceTL * discount) / 100;

    const lineTotal = discountedPrice * item.quantity;

    totalNet += lineTotal;

    calculatedItems.push({
      ...item,
      unitPriceTL,
      lineTotal,
    });
  }

  const totalWithVat = totalNet * (1 + vatRate / 100);

  return {
    exchangeRate,
    totalNet,
    totalWithVat,
    items: calculatedItems,
  };
}

module.exports = {
  calculateOffer,
};