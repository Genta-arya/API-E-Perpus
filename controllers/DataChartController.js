import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getTotalStok = async (req, res) => {
  try {
    const totalStok = await prisma.book.aggregate({
      _sum: {
        stok: true,
      },
    });
    const totalStokEbook = await prisma.eBook.aggregate({
      _count: {
        id: true,
      },
    });
    const totalPeminjaman = await prisma.peminjaman.aggregate({
      _count: {
        id: true,
      },
    });

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0]; // Ambil bagian tanggal

    const totalKunjungan = await prisma.kunjungan.aggregate({
      where: {
        tanggal: {
          gte: new Date(currentDateString), // Tanggal hari ini
          lt: new Date(currentDateString + "T23:59:59.999Z"), // Tanggal hari ini ditambah 1 hari dan dikurangi 1 milidetik
        },
      },
      _sum: {
        jml_org: true,
      },
    });

    res.json({
      totalStok: totalStok._sum.stok,
      ebookStok: totalStokEbook._count.id,
      jumlah_pinjam: totalPeminjaman._count.id,
      totalKunjungan: totalKunjungan._sum.jml_org,
    });
  } catch (error) {
    console.error("Error retrieving total stock:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving total stock." });
  }
};

