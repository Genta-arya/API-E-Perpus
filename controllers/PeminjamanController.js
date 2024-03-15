import prisma from "../config/Prisma.js";

export const createPinjam = async (req, res) => {
  try {
    const {
      nm_siswa,
      noHp,
      tanggal_peminjaman,
      tanggal_selesai,
      kelas,
      judul,
      status,
      jumlah,
    } = req.body;
    const { id } = req.params;

    // Cari buku berdasarkan judul
    const existingBook = await prisma.book.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });

    if (!existingBook) {
      return res.status(404).json({ error: "Buku tidak ditemukan" });
    }

    // Pastikan stok cukup untuk dipinjam
    if (existingBook.stok < parseInt(jumlah, 10)) {
      return res.status(400).json({ error: "Stok buku tidak mencukupi" });
    }

    // Menambahkan data peminjaman ke database menggunakan Prisma
    const newPinjam = await prisma.peminjaman.create({
      data: {
        namaSiswa: nm_siswa,
        noHp: noHp,
        tgl_pinjam: new Date(tanggal_peminjaman).toISOString(),
        tgl_selesai: new Date(tanggal_selesai).toISOString(),
        kelas,
        jumlah: parseInt(jumlah, 10),
        judulBuku: judul,
        status,
      },
    });

    // Mengurangkan stok buku
    await prisma.book.update({
      where: {
        id: parseInt(id, 10),
      },
      data: {
        stok: existingBook.stok - parseInt(jumlah, 10),
      },
    });

    res.status(201).json({ data: newPinjam });
  } catch (error) {
    console.error("Error in createPinjam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Pastikan untuk memutus koneksi Prisma setelah operasi selesai
    await prisma.$disconnect();
  }
};

export const editPinjam = async (req, res) => {
  try {
    const {
      id,
      nm_siswa,
      noHp,
      tanggal_peminjaman,
      tanggal_selesai,
      kelas,
      judul,
      status,
      jumlah,
    } = req.body;

    // Retrieve existing peminjaman data
    const existingPinjam = await prisma.peminjaman.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });

    if (!existingPinjam) {
      return res.status(404).json({ error: "Peminjaman tidak ditemukan" });
    }

    // Retrieve existing book data
    const existingBook = await prisma.book.findUnique({
      where: {
        judul: existingPinjam.judulBuku,
      },
    });

    if (!existingBook) {
      return res.status(404).json({ error: "Buku tidak ditemukan" });
    }
    // If the status is changed to "Dikembalikan," increase the stock of the book
    if (status === "Dikembalikan" && existingPinjam.status !== "Dikembalikan") {
      await prisma.book.update({
        where: {
          judul: existingPinjam.judulBuku,
        },
        data: {
          stok: existingBook.stok + parseInt(jumlah, 10),
        },
      });
    }

    // If the status is changed to "Dipinjamkan," reduce the stock of the book
    if (
      status === "Belum Dikembalikan" &&
      existingPinjam.status !== "Belum Dikembalikan"
    ) {
      // Check if there is enough stock to be borrowed
      if (existingBook.stok < parseInt(jumlah, 10)) {
        return res.status(400).json({ error: "Stok buku tidak mencukupi" });
      }

      // Reduce the stock of the book
      await prisma.book.update({
        where: {
          judul: existingPinjam.judulBuku,
        },
        data: {
          stok: existingBook.stok - parseInt(jumlah, 10),
        },
      });
    }

    // Update peminjaman data
    const updatedPinjam = await prisma.peminjaman.update({
      where: {
        id: existingPinjam.id,
      },
      data: {
        namaSiswa: nm_siswa,
        noHp: noHp,
        tgl_pinjam: new Date(tanggal_peminjaman).toISOString(),
        tgl_selesai: new Date(tanggal_selesai).toISOString(),
        kelas,
        judulBuku: judul,
        status,
        jumlah: parseInt(jumlah, 10),
      },
    });

    res.status(200).json({ data: updatedPinjam });
  } catch (error) {
    console.error("Error in editPinjam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const deletePinjam = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve existing peminjaman data
    const existingPinjam = await prisma.peminjaman.findUnique({
      where: {
        id: parseInt(id, 10),
      },
    });

    if (!existingPinjam) {
      return res.status(404).json({ error: "Peminjaman tidak ditemukan" });
    }

    // Retrieve existing book data
    const existingBook = await prisma.book.findUnique({
      where: {
        judul: existingPinjam.judulBuku,
      },
    });

    if (!existingBook) {
      return res.status(404).json({ error: "Buku tidak ditemukan" });
    }

    // If the status is "Belum Dikembalikan" or "Dipinjamkan," return the stock to the book
    if (
      existingPinjam.status === "Belum Dikembalikan" ||
      existingPinjam.status === "Dipinjamkan"
    ) {
      await prisma.book.update({
        where: {
          judul: existingPinjam.judulBuku,
        },
        data: {
          stok: existingBook.stok + existingPinjam.jumlah,
        },
      });
    }

    // Delete peminjaman data
    await prisma.peminjaman.delete({
      where: {
        id: existingPinjam.id,
      },
    });

    res.status(200).json({ message: "Peminjaman berhasil dihapus" });
  } catch (error) {
    console.error("Error in deletePinjam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const getPeminjaman = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // Retrieve peminjaman data with pagination
    const peminjamans = await prisma.peminjaman.findMany({
      skip: offset,
      take: parseInt(pageSize, 10),
      orderBy: { id: "desc" },
    });

    // Check and update the status based on the return date
    const updatedPeminjamans = await Promise.all(
      peminjamans.map(async (peminjaman) => {
        const tglPinjam = new Date(peminjaman.tgl_pinjam);
        const tglSelesai = new Date(peminjaman.tgl_selesai);

        if (tglSelesai < tglPinjam  && peminjaman.status !== "Dikembalikan") {
          // If the current date is greater than the return date and the status is not "Dikembalikan"
          // Update the status to "Belum Dikembalikan"
          return prisma.peminjaman.update({
            where: { id: peminjaman.id },
            data: { status: "Belum Dikembalikan" },
          });
        }

        return peminjaman;
      })
    );

    // Retrieve total count of peminjaman data for pagination info
    const totalCount = await prisma.peminjaman.count();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(pageSize, 10));

    res.status(200).json({
      data: updatedPeminjamans,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(pageSize, 10),
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in getPeminjaman:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const searchPeminjaman = async (req, res) => {
  try {
    const { q: nama, page = 1, perPage = 10 } = req.query;

    // Check if nama parameter is provided
    if (!nama) {
      return res.status(400).json({ error: "Nama parameter is missing." });
    }

    // Calculate the offset based on page and perPage
    const offset = (page - 1) * perPage;

    // Retrieve peminjaman with a nama containing the provided string (case-insensitive)
    const data = await prisma.peminjaman.findMany({
      where: {
        namaSiswa: {
          contains: nama,
       
        },
      },
      skip: offset,
      take: perPage,
      orderBy: { id: "desc" },
    });

    if (data.length === 0) {
      return res.status(404).json({
        message: "Data peminjaman tidak ditemukan.",
        totalData: 0,
        currentPage: 0,
        totalPages: 0,
      });
    }

    const totalData = await prisma.peminjaman.count({
      where: {
        namaSiswa: {
          contains: nama,
    
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalData / perPage);

    res
      .status(200)
      .json({ data, totalData, currentPage: parseInt(page, 10), totalPages });
  } catch (error) {
    console.error("Error searching peminjaman:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getllPinjam = async(req,res) => {
    try {
      // Dapatkan semua buku dari database menggunakan Prisma
      const allBooks = await prisma.peminjaman.findMany();
  
      // Kirim respon JSON dengan daftar semua buku
      res.status(200).json({data:allBooks});
    } catch (error) {
      // Tangani kesalahan jika terjadi
      console.error("Error retrieving books:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  