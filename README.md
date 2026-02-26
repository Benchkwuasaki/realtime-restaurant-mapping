# 🚀 MKWD HRIS — Project Setup Guide

Welcome to the **MKWD (Metro Kidapawan Water District) HRIS** project!

This README contains the essential steps for local development setup, including the default seeded user credentials for testing.

---

## 🏢 About MKWD

**MKWD** stands for **Metro Kidapawan Water District**.

<p align="center">
  <img src="resources/js/assets/images/logo.svg" alt="Metro Kidapawan Water District Logo" height="120" />
</p>

---

## 🔐 Default Development User

For development and testing purposes, a pre-seeded user account is available after running the database seeders.

> ⚠️ **This account is intended for local development only.**  
> Do NOT use these credentials in production environments.

### 📧 Credentials

**Email:**  
`admin@gmail.com`

**Password:**  
`password`

---

## 🛠 Local Setup

After cloning the repository, run the following commands:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
composer run dev