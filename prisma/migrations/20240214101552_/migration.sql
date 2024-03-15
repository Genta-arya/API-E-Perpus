-- CreateTable
CREATE TABLE `Auth` (
    `uid` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `avatar` VARCHAR(255) NULL,
    `token_jwt` VARCHAR(255) NULL,
    `otp` VARCHAR(191) NULL,

    UNIQUE INDEX `Auth_username_key`(`username`),
    UNIQUE INDEX `Auth_email_key`(`email`),
    UNIQUE INDEX `Auth_token_jwt_key`(`token_jwt`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Book` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `penulis` VARCHAR(191) NOT NULL,
    `tahunTerbit` INTEGER NOT NULL,
    `penerbit` VARCHAR(191) NOT NULL,
    `cover` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `lokasiRak` VARCHAR(191) NOT NULL,
    `halaman` VARCHAR(191) NOT NULL,
    `isbn` VARCHAR(191) NOT NULL,
    `stok` INTEGER NOT NULL,
    `class` VARCHAR(191) NOT NULL,
    `tanggalPost` DATETIME(3) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Book_judul_key`(`judul`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EBook` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `penulis` VARCHAR(191) NOT NULL,
    `tahunTerbit` INTEGER NOT NULL,
    `penerbit` VARCHAR(191) NOT NULL,
    `cover` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NOT NULL,
    `halaman` VARCHAR(191) NOT NULL,
    `isbn` VARCHAR(191) NOT NULL,
    `tanggalPost` DATETIME(3) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `drive` VARCHAR(191) NULL,

    UNIQUE INDEX `EBook_judul_key`(`judul`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Peminjaman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaSiswa` VARCHAR(191) NOT NULL,
    `noHp` VARCHAR(191) NOT NULL,
    `tgl_pinjam` DATETIME(3) NOT NULL,
    `tgl_selesai` DATETIME(3) NOT NULL,
    `kelas` VARCHAR(191) NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `judulBuku` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pendamping` VARCHAR(255) NOT NULL,
    `kelas` VARCHAR(191) NOT NULL,
    `kegiatan` TEXT NOT NULL,
    `jml_org` INTEGER NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Berita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gambar` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `isi` TEXT NOT NULL,
    `posted` VARCHAR(191) NOT NULL,
    `tanggalPost` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Berita_judul_key`(`judul`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_judulBuku_fkey` FOREIGN KEY (`judulBuku`) REFERENCES `Book`(`judul`) ON DELETE RESTRICT ON UPDATE CASCADE;
