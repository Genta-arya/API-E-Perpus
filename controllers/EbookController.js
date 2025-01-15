
import dotenv from "dotenv";
import { bucket } from "../config/Firebase.js";
import prisma from "../config/Prisma.js";

dotenv.config();


/**
 * @description Fungsi untuk membuat entri buku baru dalam sistem.
 * @param {Object} req - Objek permintaan HTTP (Express Request Object).
 * @param {Object} res - Objek tanggapan HTTP (Express Response Object).
 */

export const createdEBook = async (req, res) => {
  try {
    // Mendapatkan data buku dari permintaan HTTP
    const {
      judul,
      halaman,
      penulis,
      tahunTerbit,
      penerbit,
      isbn,
      deskripsi,
      drive,
      kategori,
    } = req.body;

    // Mengonversi stok menjadi tipe data integer

    const tahunTerbitParse = parseInt(tahunTerbit, 10);

    // Memastikan file sampul buku ada dalam permintaan
    const pdfFile = req.files.pdf;
    const coverFile = req.files.foto;

    if (!coverFile) {
      return res
        .status(400)
        .json({ error: "Cover file is missing in the request." });
    }

    // Fungsi untuk membersihkan nama file dari karakter yang tidak diizinkan
    function sanitizeFileName(input) {
      return input.replace(/[^a-zA-Z0-9_-]/g, "_");
    }

    const sanitizedJudul = sanitizeFileName(judul);

    let pdfFileURL = "-"; // Default value for pdfUrl

    // Check if pdfFile exists
    if (pdfFile) {
      const pdfFileName = `${sanitizedJudul}.pdf`;

      // Mengambil buffer file PDF buku
      const pdfFileBuffer = pdfFile.data;

      // Menentukan path file di Firebase Storage
      const pdfFilePath = `E-Book/${pdfFileName}`;

      // Menginisialisasi objek file di Firebase Storage
      const pdfFileFirebase = bucket.file(pdfFilePath);

      // Membuat writable stream untuk upload resumable
      const pdfFileStream = pdfFileFirebase.createWriteStream({
        metadata: {
          contentType: "application/pdf",
        },
        resumable: false, // Set upload resumable menjadi false
      });

      // Mengirim data buffer ke stream
      pdfFileStream.end(pdfFileBuffer);

      // Menunggu hingga stream selesai (upload selesai)
      await new Promise((resolve, reject) => {
        pdfFileStream.on("finish", resolve);
        pdfFileStream.on("error", reject);
      });

      // Mengambil URL file PDF buku dari Firebase Storage
      pdfFileURL = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(pdfFilePath)}?alt=media`;
    }
    // Menentukan nama file sampul buku di Firebase Storage
    const thumbnailFileName = `image_${sanitizedJudul}_cover.jpg`;

    // Mengambil buffer file sampul buku
    const thumbnailFileBuffer = coverFile.data;

    // Menentukan path file di Firebase Storage
    const thumbnailFilePath = `Images/Ebook/${thumbnailFileName}`;

    // Menginisialisasi objek file di Firebase Storage
    const thumbnailFileFirebase = bucket.file(thumbnailFilePath);

    // Menyimpan file sampul buku di Firebase Storage
    await thumbnailFileFirebase.save(thumbnailFileBuffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    // Mengambil URL file sampul buku dari Firebase Storage
    const thumbnailURL = `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(thumbnailFilePath)}?alt=media`;

    // Membuat entri buku baru dalam basis data
    const existingBook = await prisma.eBook.findFirst({
      where: {
        judul: {
          equals: judul,
          
        },
      },
    });

    if (existingBook) {
      return res.status(400).json({ error: "Judul Buku sudah ada dikatalog" });
    }

    const createdBook = await prisma.eBook.create({
      data: {
        judul,
        halaman,
        penulis,
        isbn,
        tahunTerbit: tahunTerbitParse,
        penerbit,
        cover: thumbnailURL,
        deskripsi,
        pdfUrl: pdfFileURL,
        // Only add the drive link if the pdfFile is not present
        ...(pdfFile ? {} : { drive }),
        tanggalPost: new Date(),
        kategori,
      },
    });


    // Mengirim tanggapan sukses dengan data buku yang telah dibuat
    res.status(201).json(createdBook);
  } catch (error) {
    // Menangani kesalahan dan mengirim tanggapan kesalahan
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Memastikan koneksi dengan Prisma ditutup setelah selesai
    await prisma.$disconnect();
  }
};

export const editEBook = async (req, res) => {
  try {
    // Mendapatkan ID buku dari permintaan HTTP
    const bookId = req.params.id;
    const bookIdConvert = parseInt(bookId, 10);

    // Mendapatkan data buku yang akan diubah dari permintaan HTTP
    const {
      judul,
      halaman,
      penulis,
      tahunTerbit,
      penerbit,
      isbn,
      deskripsi,
      kategori,
    } = req.body;

    // Mengonversi stok dan tahunTerbit menjadi tipe data integer

    const tahunTerbitParse = parseInt(tahunTerbit, 10);

    // Mendapatkan file sampul buku dan PDF dari permintaan HTTP (jika ada)
    const coverFile = req.files && req.files.foto;
    const pdfFile = req.files && req.files.pdf;

    // Jika ada file sampul baru, maka proses pembaruan sampul
    if (coverFile) {
      // Fungsi untuk membersihkan nama file dari karakter yang tidak diizinkan
      function sanitizeFileName(input) {
        return input.replace(/[^a-zA-Z0-9_-]/g, "_");
      }

      // Membersihkan judul untuk digunakan sebagai nama file
      const sanitizedJudul = sanitizeFileName(judul);

      // Menentukan nama file sampul buku di Firebase Storage
      const thumbnailFileName = `image_${sanitizedJudul}_cover.jpg`;

      // Mengambil buffer file sampul buku
      const thumbnailFileBuffer = coverFile.data;

      // Menentukan path file di Firebase Storage
      const thumbnailFilePath = `Images/${thumbnailFileName}`;

      // Menginisialisasi objek file di Firebase Storage
      const thumbnailFileFirebase = bucket.file(thumbnailFilePath);

      // Menyimpan file sampul buku di Firebase Storage
      await thumbnailFileFirebase.save(thumbnailFileBuffer, {
        metadata: {
          contentType: "image/jpeg",
        },
      });

      // Mengambil URL file sampul buku dari Firebase Storage
      const thumbnailURL = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(thumbnailFilePath)}?alt=media`;

      // Jika ada file PDF, maka proses pembaruan PDF
      if (pdfFile) {
        // Fungsi untuk membersihkan nama file PDF dari karakter yang tidak diizinkan
        const sanitizedPdfJudul = sanitizeFileName(judul);

        // Menentukan nama file PDF buku di Firebase Storage
        const pdfFileName = `${sanitizedPdfJudul}.pdf`;

        // Mengambil buffer file PDF buku
        const pdfFileBuffer = pdfFile.data;

        // Menentukan path file di Firebase Storage
        const pdfFilePath = `E-Book/${pdfFileName}`;

        // Menginisialisasi objek file di Firebase Storage
        const pdfFileFirebase = bucket.file(pdfFilePath);

        // Menyimpan file PDF buku di Firebase Storage
        await pdfFileFirebase.save(pdfFileBuffer, {
          metadata: {
            contentType: "application/pdf",
          },
        });

        // Mengambil URL file PDF buku dari Firebase Storage
        const pdfFileURL = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(pdfFilePath)}?alt=media`;

        // Mengupdate buku dengan data yang baru termasuk URL sampul dan PDF baru
        const updatedBookWithCoverAndPDF = await prisma.EBook.update({
          where: { id: bookIdConvert },
          data: {
            judul,
            penulis,

            isbn,
            halaman,
            tahunTerbit: tahunTerbitParse,
            penerbit,
            deskripsi,

            kategori,
            cover: thumbnailURL,
            pdfUrl: pdfFileURL,
          },
        });

        // Mengirim tanggapan sukses dengan data buku yang telah diubah
        res.status(200).json(updatedBookWithCoverAndPDF);
      } else {
        // Jika tidak ada file PDF baru, maka hanya mengupdate data buku tanpa mengubah URL sampul
        const updatedBookWithCover = await prisma.EBook.update({
          where: { id: bookIdConvert },
          data: {
            judul,
            penulis,
            isbn,
            halaman,
            tahunTerbit: tahunTerbitParse,
            penerbit,
            deskripsi,

            kategori,
            cover: thumbnailURL,
          },
        });

        // Mengirim tanggapan sukses dengan data buku yang telah diubah
        res.status(200).json(updatedBookWithCover);
      }
    } else {
      // Jika tidak ada file sampul baru, tapi ada file PDF baru, maka proses pembaruan PDF
      if (pdfFile) {
        function sanitizeFileName(input) {
          return input.replace(/[^a-zA-Z0-9_-]/g, "_");
        }
        // Fungsi untuk membersihkan nama file PDF dari karakter yang tidak diizinkan
        const sanitizedPdfJudul = sanitizeFileName(judul);

        // Menentukan nama file PDF buku di Firebase Storage
        const pdfFileName = `${sanitizedPdfJudul}.pdf`;

        // Mengambil buffer file PDF buku
        const pdfFileBuffer = pdfFile.data;

        // Menentukan path file di Firebase Storage
        const pdfFilePath = `E-Book/${pdfFileName}`;

        // Menginisialisasi objek file di Firebase Storage
        const pdfFileFirebase = bucket.file(pdfFilePath);

        // Menyimpan file PDF buku di Firebase Storage
        await pdfFileFirebase.save(pdfFileBuffer, {
          metadata: {
            contentType: "application/pdf",
          },
        });

        // Mengambil URL file PDF buku dari Firebase Storage
        const pdfFileURL = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(pdfFilePath)}?alt=media`;

        // Mengupdate buku dengan data yang baru termasuk URL PDF baru
        const updatedBookWithPDF = await prisma.EBook.update({
          where: { id: bookIdConvert },
          data: {
            judul,
            penulis,
            isbn,
            halaman,
            tahunTerbit: tahunTerbitParse,
            penerbit,
            deskripsi,
            kategori,
            pdfUrl: pdfFileURL,
          },
        });

        // Mengirim tanggapan sukses dengan data buku yang telah diubah
        res.status(200).json(updatedBookWithPDF);
      } else {
        // Jika tidak ada file sampul dan PDF baru, maka hanya mengupdate data buku
        const updatedBookWithoutCoverAndPDF = await prisma.EBook.update({
          where: { id: bookIdConvert },
          data: {
            judul,
            penulis,
            isbn,
            halaman,
            tahunTerbit: tahunTerbitParse,
            penerbit,
            deskripsi,
            kategori,
          },
        });

        // Mengirim tanggapan sukses dengan data buku yang telah diubah
        res.status(200).json(updatedBookWithoutCoverAndPDF);
      }
    }
  } catch (error) {
    // Menangani kesalahan dan mengirim tanggapan kesalahan
    console.error("Error editing book:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Memastikan koneksi dengan Prisma ditutup setelah selesai
    await prisma.$disconnect();
  }
};

export const getEBook = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // Retrieve total count of books
    const totalBooks = await prisma.eBook.count();

    // Retrieve books with pagination
    const books = await prisma.eBook.findMany({
     
      orderBy: { id: "desc" },
      // Your other query conditions if any
    });
    const totalPages = Math.ceil(totalBooks / parseInt(pageSize, 10));

    res.status(200).json({
      books,
      totalBooks,
      page: parseInt(page, 10),
      limit: parseInt(pageSize, 10),
      totalPages,
    });
  } catch (error) {
    console.error("Error retrieving books:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteEBook = async (req, res) => {
  try {
    // Mendapatkan ID buku dari permintaan HTTP
    const bookId = req.params.id;
    const bookIdConvert = parseInt(bookId, 10);

    // Menghapus buku berdasarkan ID
    const deletedBook = await prisma.eBook.delete({
      where: { id: bookIdConvert },
    });

    // Mengirim tanggapan sukses dengan data buku yang telah dihapus
    res.status(200).json(deletedBook);
  } catch (error) {
    // Menangani kesalahan dan mengirim tanggapan kesalahan
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Memastikan koneksi dengan Prisma ditutup setelah selesai
    await prisma.$disconnect();
  }
};

export const searchEBook = async (req, res) => {
  try {
    const { q: title, page = 1, perPage = 10 } = req.query;

    // Check if title parameter is provided
    if (!title) {
      return res.status(400).json({ error: "Title parameter is missing." });
    }

    // Calculate the offset based on page and perPage
    const offset = (page - 1) * perPage;

    // Retrieve books with a title containing the provided string (case-insensitive)
    const books = await prisma.eBook.findMany({
      where: {
        judul: {
          contains: title,
         
        },
      },
      skip: offset,
      take: perPage,
      orderBy: { id: "desc" },
    });

    if (books.length === 0) {
      return res.status(404).json({
        message: "Buku tidak ditemukan.",
        totalData: 0,
        currentPage: 0,
        totalPages: 0,
      });
    }

    const totalData = await prisma.eBook.count({
      where: {
        judul: {
          contains: title,
          
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalData / perPage);

    res
      .status(200)
      .json({ books, totalData, currentPage: parseInt(page, 10), totalPages });
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const searchEJudul = async (req, res) => {
  try {
    // Extracting search query from request parameters
    const { q: title } = req.query;

    // Checking if the search query is provided
    if (!title) {
      return res
        .status(400)
        .json({ error: "Search query 'q' is missing in the request." });
    }

    // Perform the search using Prisma
    const searchResults = await prisma.book.findMany({
      where: {
        judul: {
          contains: title, // Using "contains" for a case-insensitive search
        
        },
      },
      // Selecting only the 'judul' and 'id' fields in the response
      select: {
        judul: true,
        id: true,
        stok: true,
      },
    });

    // Checking if any titles were found
    if (searchResults.length === 0) {
      return res.status(404).json({
        error: "No titles found with the provided query.",
        status: 404,
      });
    }

    // Sending the search results as a response
    res.status(200).json({ searchResults, status: 200 });
  } catch (error) {
    // Handling errors and sending an error response
    console.error("Error in searchJudul:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure to disconnect Prisma client after the operation
    await prisma.$disconnect();
  }
};


export const geteBookRandom = async (req, res) => {
  try {
    // Ambil 5 buku acak dari database menggunakan Prisma
    const randomBooks = await prisma.eBook.findMany({
      take: 6,
      orderBy: {
        // Menggunakan kolom 'id' untuk mengurutkan secara acak
        // Pastikan kolom ini memiliki nilai yang benar-benar acak
        id: 'asc',
      },
    });

    // Shuffle array untuk mendapatkan hasil yang lebih acak
    const shuffledBooks = shuffleArray(randomBooks);

    // Kirim respons dengan data buku acak
    res.status(200).json({ books: shuffledBooks });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  } finally {
    // Pastikan untuk selalu menutup koneksi Prisma setelah digunakan
    await prisma.$disconnect();
  }
};


export const getllebook = async(req,res) => {
    try {
      // Dapatkan semua buku dari database menggunakan Prisma
      const allBooks = await prisma.eBook.findMany();
  
      // Kirim respon JSON dengan daftar semua buku
      res.status(200).json({data:allBooks});
    } catch (error) {
      // Tangani kesalahan jika terjadi
      console.error("Error retrieving books:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  



// Fungsi untuk mengacak urutan array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
