import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createdKunjungan = async (req, res) => {
  try {
    const { kelas, tanggal, keperluan, jumlah, pendamping } = req.body;

    // Parse jumlah menjadi integer
    const parsedJumlah = parseInt(jumlah);

    // Ubah tanggal menjadi string format ISO
    const isoStringTanggal = new Date(tanggal).toISOString();

    // Simpan data kunjungan ke database menggunakan Prisma Client
    const newKunjungan = await prisma.kunjungan.create({
      data: {
        kelas,
        tanggal: isoStringTanggal,
        kegiatan: keperluan,
        jml_org: parsedJumlah,
        pendamping,
      },
    });

    // Kirim respons sukses
    res
      .status(201)
      .json({ message: "Kunjungan berhasil dibuat", data: newKunjungan });
  } catch (error) {
    // Tangani kesalahan jika terjadi
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat membuat kunjungan" });
  } finally {
    // Ingat untuk selalu menutup koneksi ke Prisma Client setelah selesai
    await prisma.$disconnect();
  }
};

export const getKunjungan = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // Dapatkan data kunjungan dari database dengan paginasi
    const kunjungan = await prisma.kunjungan.findMany({
      skip: offset,
      take: parseInt(pageSize),
      orderBy: {
        id: "desc", // Urutkan berdasarkan id secara descending (dari belakang ke depan)
      },
    });

    // Dapatkan jumlah total kunjungan
    const totalKunjungan = await prisma.kunjungan.count();

    // Hitung jumlah halaman berdasarkan total item dan ukuran halaman
    const totalPages = Math.ceil(totalKunjungan / pageSize);

    // Jika tidak ada data kunjungan, kirim respons 404
    if (kunjungan.length === 0) {
      return res
        .status(404)
        .json({ message: "Data kunjungan tidak ditemukan", status: 404 });
    }

    // Kirim respons dengan data kunjungan dan informasi paginasi
    res.status(200).json({
      data: kunjungan,
      totalPage: totalPages,
      item: totalKunjungan,
      status: 200,
    });
  } catch (error) {
    // Tangani kesalahan jika terjadi
    console.error("Error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data kunjungan",
      status: 500,
    });
  } finally {
    // Ingat untuk selalu menutup koneksi ke Prisma Client setelah selesai
    await prisma.$disconnect();
  }
};

export const editKunjungan = async (req, res) => {
  try {
    const { id, kelas, tanggal, kegiatan, jml_org, pendamping } = req.body;

    const isoStringTanggal = new Date(tanggal).toISOString();

    // Perbarui kunjungan di database
    const updatedKunjungan = await prisma.kunjungan.update({
      where: { id: parseInt(id) }, // id dikonversi menjadi integer jika diperlukan
      data: {
        kelas,
        tanggal: isoStringTanggal,
        kegiatan,
        jml_org: parseInt(jml_org), // jumlah juga dikonversi menjadi integer
        pendamping,
      },
    });

    res.status(200).json({
      message: "Kunjungan berhasil diperbarui",
      data: updatedKunjungan,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat memperbarui kunjungan" });
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteKunjungan = async (req, res) => {
  try {
    const { id } = req.params;

    // Hapus data kunjungan berdasarkan ID
    const deletedKunjungan = await prisma.kunjungan.delete({
      where: {
        id: parseInt(id), // Pastikan id diubah menjadi tipe data yang sesuai (misalnya, integer)
      },
    });

    if (!deletedKunjungan) {
      return res.status(404).json({ error: "Data kunjungan tidak ditemukan" });
    }

    res
      .status(200)
      .json({ message: "Data kunjungan berhasil dihapus", deletedKunjungan });
  } catch (error) {
    console.error("Error deleting kunjungan:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Data kunjungan tidak ditemukan" });
    }
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menghapus data kunjungan", message: error.message });
  }
};

export const searchKunjungan = async (req, res) => {
  try {
    const { q: pendampingName, page = 1, perPage = 10 } = req.query;

    const pageNum = parseInt(page);
    const size = parseInt(perPage);

    const offset = (pageNum - 1) * size;

    const kunjungan = await prisma.kunjungan.findMany({
      where: {
        pendamping: {
          contains: pendampingName,
        },
      },
      skip: offset,
      take: size,
    });
    if (kunjungan.length === 0) {
      return res.status(404).json({
        message: "Data tidak ditemukan.",
        currentPage: pageNum,
      });
    }

    const totalKunjungan = await prisma.kunjungan.count({
      where: {
        pendamping: {
          contains: pendampingName,
        },
      },
    });

    const totalPages = Math.ceil(totalKunjungan / size);

    res.status(200).json({
      data: kunjungan,
      totalPage: totalPages,
      item: totalKunjungan,
      currentPage: pageNum,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while searching for kunjungan data." });
  }
};

export const getAllKunjungan = async (req, res) => {
  try {
    const kunjungan = await prisma.kunjungan.findMany();

    if (kunjungan.length === 0) {
      return res.status(404).json({
        message: "No kunjungan data found",
      });
    }

    res.status(200).json({
      data: kunjungan,
      totalItems: kunjungan.length,
    });
  } catch (error) {
    console.error("Error retrieving kunjungan data:", error);
    res.status(500).json({
      error: "An error occurred while retrieving kunjungan data",
    });
  }
};
