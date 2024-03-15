import express from "express";
import {
  createdBook,
  deleteBook,
  editBook,
  getBook,
  getBookByCategory,
  getBookByJudul,
  getBookRandom,
  getallbook,
  searchBook,
  searchJudul,
} from "../controllers/BukuController.js";
import {
  Logout,
  changePassowrd,
  changePassword,
  editProfil,
  handleLogin,
  handleRegister,
  isLoggIn,
  sendOTP,
  verifOTP,
} from "../controllers/AuthController.js";
import { Middleware } from "../controllers/Midleware.js";
import {
  createPinjam,
  deletePinjam,
  editPinjam,
  getPeminjaman,
  getllPinjam,
  searchPeminjaman,
} from "../controllers/PeminjamanController.js";
import {
  createdEBook,
  deleteEBook,
  editEBook,
  getEBook,
  geteBookRandom,
  getllebook,
  searchEBook,
  searchEJudul,
} from "../controllers/EbookController.js";
import { getTotalStok } from "../controllers/DataChartController.js";
import {
  createdKunjungan,
  deleteKunjungan,
  editKunjungan,
  getAllKunjungan,
  getKunjungan,
  searchKunjungan,
} from "../controllers/KunjunganController.js";
import { cariBerita, createBerita, deleteBerita, editBerita, getBerita, getBeritaById } from "../controllers/BeritaController.js";

const router = express.Router();

// AuthController
router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/checkLoggin", isLoggIn);
router.post("/logout", Logout);
router.put("/edit/profil",Middleware, editProfil);
router.put("/edit/password", Middleware,changePassword)
router.post("/send-otp",sendOTP)
router.post("/verifiy-otp",verifOTP)
router.put("/forgot",changePassowrd)

// BukuController
router.post("/upload/buku", Middleware, createdBook);
router.get("/books", getBook);
router.get("/getallbook", getallbook);
router.get("/books/search", searchBook);
router.get("/books/judul", searchJudul);
router.put("/edit/buku/:id", Middleware, editBook);
router.delete("/delete/buku/:id", deleteBook);
router.get("/book/random", getBookRandom);
router.post("/upload/ebuku", Middleware, createdEBook);
router.get("/book/detail/:judul",getBookByJudul)

// Ebook
router.get("/ebooks", getEBook);
router.get("/ebooks/search", searchEBook);
router.get("/ebooks/judul", searchEJudul);
router.put("/edit/ebuku/:id", Middleware, editEBook);
router.delete("/delete/ebuku/:id", deleteEBook);
router.get("/ebook/random", geteBookRandom);
router.get("/getallebook", getllebook);
router.get("/book/category", getBookByCategory);

// peminjaman
router.post("/upload/pinjam/:id", Middleware, createPinjam);
router.get("/peminjaman", getPeminjaman);
router.get("/peminjaman/search", searchPeminjaman);
router.put("/edit/peminjaman", Middleware, editPinjam);
router.delete("/delete/pinjam/:id",Middleware, deletePinjam);
router.get("/getallpinjam", getllPinjam);

// Statistik
router.get("/chart", getTotalStok);

// Kunjungan
router.post("/add/kunjungan", Middleware, createdKunjungan);
router.get("/get/kunjungan", getKunjungan);
router.put("/update/kunjungan", Middleware ,editKunjungan);
router.delete("/delete/kunjungan/:id",Middleware, deleteKunjungan);
router.get("/kunjungan/search", searchKunjungan);
router.get("/getAllKunjungan", getAllKunjungan);

// berita
router.post("/upload/berita",Middleware,createBerita)
router.get("/berita",getBerita)
router.put("/edit/berita",Middleware,editBerita)
router.delete("/delete/berita/:id",Middleware,deleteBerita)
router.get("/search/berita",cariBerita)
router.get("/berita/detail/:judul",getBeritaById)
export default router;
