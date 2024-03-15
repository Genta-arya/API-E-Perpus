import { PrismaClient } from "@prisma/client";
import { bucket } from "../config/Firebase.js";

const prisma = new PrismaClient();

export const createBerita = async (req, res) => {
  try {
    const { judul, postedBy, isi } = req.body;
    // Jika Anda memiliki sistem otentikasi dan ingin menyimpan info siapa yang memposting
    const coverFile = req.files && req.files.foto;

    if (isi.length > 500000) {
      return res.status(400).json({
        message:
          "Isi berita terlalu panjang. Maksimum 500.000 karakter diizinkan.",
      });
    }

    // Jika tidak ada file sampul, kembalikan respons dengan pesan kesalahan
    if (!coverFile) {
      return res.status(400).json({ message: "Mohon unggah gambar sampul." });
    }

    // Fungsi untuk membersihkan nama file dari karakter yang tidak diizinkan
    function sanitizeFileName(input) {
      return input.replace(/[^a-zA-Z0-9_-]/g, "_");
    }

    // Membersihkan judul untuk digunakan sebagai nama file
    const sanitizedJudul = sanitizeFileName(judul);

    // Menentukan nama file sampul berita di Firebase Storage
    const thumbnailFileName = `image_${sanitizedJudul}_cover.jpg`;

    // Mengambil buffer file sampul berita
    const thumbnailFileBuffer = coverFile.data;

    // Menentukan path file di Firebase Storage
    const thumbnailFilePath = `Berita/${thumbnailFileName}`;

    // Menginisialisasi objek file di Firebase Storage
    const thumbnailFileFirebase = bucket.file(thumbnailFilePath);

    // Menyimpan file sampul berita di Firebase Storage
    await thumbnailFileFirebase.save(thumbnailFileBuffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    // Mengambil URL file sampul berita dari Firebase Storage
    const thumbnailURL = `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(thumbnailFilePath)}?alt=media`;

    const existingBerita = await prisma.berita.findUnique({
      where: {
        judul: judul,
      },
    });

    if (existingBerita) {
      return res.status(400).json({ message: "Judul berita sudah ada." });
    }

    // Buat berita baru di database
    const newBerita = await prisma.berita.create({
      data: {
        judul,
        gambar: thumbnailURL,
        posted: postedBy,
        isi: isi,
      },
    });

    res
      .status(201)
      .json({ message: "Berita berhasil dibuat.", data: newBerita });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan dalam membuat berita." });
  }
};

export const editBerita = async (req, res) => {
  try {
    const { judul, isi } = req.body;
    const coverFile = req.files && req.files.foto;

    if (isi.length > 500000) {
      return res.status(400).json({
        message:
          "Isi berita terlalu panjang. Maksimum 500.000 karakter diizinkan.",
      });
    }
    const id = parseInt(req.body.id, 10);

    let thumbnailURL = ""; // Inisialisasi URL gambar thumbnail

    if (coverFile) {
    
      function sanitizeFileName(input) {
        return input.replace(/[^a-zA-Z0-9_-]/g, "_");
      }

      // Membersihkan judul untuk digunakan sebagai nama file
      const sanitizedJudul = sanitizeFileName(judul);

      // Menentukan nama file sampul berita di Firebase Storage
      const thumbnailFileName = `image_${sanitizedJudul}_cover.jpg`;

      // Mengambil buffer file sampul berita
      const thumbnailFileBuffer = coverFile.data;

      // Menentukan path file di Firebase Storage
      const thumbnailFilePath = `Berita/${thumbnailFileName}`;

      // Menginisialisasi objek file di Firebase Storage
      const thumbnailFileFirebase = bucket.file(thumbnailFilePath);

      // Menyimpan file sampul berita di Firebase Storage
      await thumbnailFileFirebase.save(thumbnailFileBuffer, {
        metadata: {
          contentType: "image/jpeg",
        },
      });

      // Mengambil URL file sampul berita dari Firebase Storage
      thumbnailURL = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(thumbnailFilePath)}?alt=media`;
    }
    let updatedBerita;
    if (coverFile) {
      // Jika cover file tersedia, update gambar juga
      updatedBerita = await prisma.berita.update({
        where: { id: id },
        data: {
          judul: judul,
          gambar: thumbnailURL,
          posted: "admin",
          isi: isi,
        },
      });
    } else {
      // Jika cover file tidak ada, jangan ganti gambar
      updatedBerita = await prisma.berita.update({
        where: { id: id },
        data: {
          judul: judul,
          // Jangan mengubah gambar saat cover file tidak ada
          posted: "admin",
          isi: isi,
        },
      });
    }
    res
      .status(200)
      .json({ message: "Berita berhasil diperbarui.", data: updatedBerita });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan dalam memperbarui berita." });
  }
};

export const getBerita = async (req, res) => {
  try {
    const { page = 1, limit = 8 } = req.query; // Menentukan halaman dan batas item per halaman dari query parameter
    const parse = parseInt(limit);
    const offset = (page - 1) * parse; // Menghitung offset untuk paginasi

    // Mengambil jumlah total berita dari basis data
    const totalBerita = await prisma.berita.count();

    // Menghitung total halaman berdasarkan jumlah berita dan batas item per halaman
    const totalPages = Math.ceil(totalBerita / parse);

    // Mengambil data berita dari basis data dengan paginasi dan batasan
    const berita = await prisma.berita.findMany({
      skip: offset, // Mengabaikan item sebelum halaman yang diminta
      take: parse, // Mengambil jumlah maksimal item yang diminta
    });

    // Mengirimkan data berita dan total halaman sebagai respons
    res.status(200).json({ data: berita, totalPages });
  } catch (error) {
    console.error("Error:", error);
    // Mengirimkan respons error jika terjadi kesalahan
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteBerita = async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID berita yang akan dihapus dari body request
    
    // Konversi id menjadi tipe data integer
    const beritaId = parseInt(id, 10);

    // Periksa apakah data berita ditemukan sebelum menghapusnya
    const existingBerita = await prisma.berita.findUnique({
      where: { id: beritaId }, // Tentukan kondisi pencarian berdasarkan ID
    });

    // Jika data berita tidak ditemukan, kirimkan respons dengan status 404 dan pesan informasi
    if (!existingBerita) {
      return res.status(404).json({ message: "Berita tidak ditemukan." });
    }

    // Lakukan penghapusan data berita dari database
    const deletedBerita = await prisma.berita.delete({
      where: { id: beritaId }, // Tentukan kondisi penghapusan berdasarkan ID
    });

    res
      .status(200)
      .json({ message: "Berita berhasil dihapus.", data: deletedBerita });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan dalam menghapus berita." });
  }
};

export const cariBerita = async (req, res) => {
  try {
    const { q: query, page = 1, perpage = 2 } = req.query;
    const offset = (page - 1) * perpage;

    const totalData = await prisma.berita.count({
      where: {
        judul: { contains: query },
      },
    });

    const hasilPencarian = await prisma.berita.findMany({
      where: {
        judul: { contains: query },
      },
      skip: offset,
      take: perpage,
    });

    const totalPage = Math.ceil(totalData / perpage);

    res.status(200).json({
      data: hasilPencarian,
      totalPage,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error saat melakukan pencarian berita:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBeritaById = async (req, res) => {
  try {
    // Ekstrak ID berita dari parameter permintaan (request)
    let { judul } = req.params;

    // Parse id as an integer
    judul= parseInt(judul);
 

    // Cari berita berdasarkan ID menggunakan Prisma
    const berita = await prisma.berita.findUnique({
      where: {
        id: judul,
      },
    });

    // Periksa apakah berita dengan ID yang diberikan ditemukan
    if (!berita) {
      return res.status(404).json({ pesan: "Berita tidak ditemukan" });
    }

    // Jika berita ditemukan, kembalikan dalam respons
    return res.status(200).json(berita);
  } catch (error) {
    console.error("Kesalahan dalam mengambil berita berdasarkan ID:", error);
    return res.status(500).json({ pesan: "Kesalahan server internal" });
  }
};
