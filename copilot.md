# TaskFlow - Internal Task Management System

## Tujuan Sistem

Aplikasi ini digunakan secara internal oleh perusahaan untuk mengatur dan memantau task antar karyawan.  
Terdapat dua jenis pengguna utama: **manager** dan **staff**.

### Peran Pengguna

- **Manager**: Membuat akun staff, membuat dan meng-assign task, serta melakukan approval atau revisi hasil kerja.
- **Staff**: Melihat task yang diberikan, menandai task selesai (submit), dan menunggu approval dari manager.

Sistem berbasis web dengan:

- Frontend: React
- Backend: Express.js
- Database: PostgreSQL
- Auth: Email-password dengan verifikasi email sederhana (link dummy atau console output)
- Lingkungan: Local development (tidak perlu hosting)
  -Use Pnpm as package manager
  -Tailwindcss v3

---

## Fitur Utama

### 1. Manajemen User

- Manager dapat membuat akun staff baru.
- Staff tidak dapat mendaftar sendiri.
- Login dapat dilakukan sebagai manager atau staff.
- Email verification (dummy) dikirim saat pembuatan akun.
- User baru hanya dapat login setelah `is_verified = true`.

### 2. Task Management

- Manager dapat membuat dan meng-assign task ke staff tertentu.
- Staff dapat menandai task sebagai selesai (`pending_review`).
- Manager dapat:
  - **Approve** → status menjadi `approved`
  - **Reject** → status menjadi `rejected`
  - **Revisi** → ubah deskripsi atau kembalikan status ke `in_progress`

### 3. Komentar dan Aktivitas

- Manager dan staff dapat menulis komentar di setiap task.
- Setiap perubahan status, komentar, atau pembuatan task dicatat di log aktivitas.

### 4. Email Verification

- Setelah user dibuat, sistem mengirim link verifikasi dummy (ditampilkan di console).
- User hanya dapat login setelah `is_verified = true`.

---

## Struktur Database (ERD Deskriptif)

### 1. users

- `id` (PK)
- `name`
- `email` (unique)
- `password_hash` → nullable (opsi Google Auth di masa depan)
- `role` → enum: `manager` / `staff`
- `manager_id` (FK → users.id) → nullable (untuk staff)
- `is_verified` (boolean, default: false)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, auto-update)

### 2. tasks

- `id` (PK)
- `title`
- `description` → text
- `priority` → enum: `low`, `medium`, `high`
- `status` → enum: `todo`, `in_progress`, `pending_review`, `approved`, `rejected`
- `deadline` → datetime, nullable
- `created_by` (FK → users.id, manager)
- `assigned_to` (FK → users.id, staff)
- `created_at`
- `updated_at`

### 3. comments

- `id` (PK)
- `task_id` (FK → tasks.id)
- `user_id` (FK → users.id)
- `message` → text
- `created_at`
- `updated_at`

### 4. activity_logs

- `id` (PK)
- `task_id` (FK → tasks.id, nullable)
- `user_id` (FK → users.id)
- `action` → string / enum (`create_task`, `update_status`, `add_comment`, dll)
- `old_value` → text, nullable
- `new_value` → text, nullable
- `created_at`

---

## Relasi Antar Tabel

- Satu manager memiliki banyak staff (`users.manager_id`)
- Satu manager dapat membuat banyak task (`tasks.created_by`)
- Satu staff dapat memiliki banyak task yang dikerjakan (`tasks.assigned_to`)
- Satu task memiliki banyak komentar (`comments`)
- Satu task memiliki banyak log aktivitas (`activity_logs`)

---

## Flow Utama

1. Manager login dan membuat akun staff.
2. Staff menerima link verifikasi dummy (via console output).
3. Setelah klik link, status `is_verified` menjadi `true`.
4. Manager membuat task dan meng-assign ke staff.
5. Staff menandai task sebagai selesai (`pending_review`).
6. Manager meninjau task dan melakukan approve/reject/revisi.
7. Semua aktivitas dicatat di `activity_logs`.

---

## Teknologi yang Digunakan

- **Frontend:** React (Vite atau CRA)
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL
- **ORM :** Prisma
- **Auth:** Email-password + verifikasi via link dummy
- **Token:** JWT disimpan di cookie (session)
- **Environment:** Local development only
