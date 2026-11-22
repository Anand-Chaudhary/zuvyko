# Backend Setup Guide

This backend is built with Express, TypeScript, and Prisma ORM using MySQL.

## Prerequisites
- Node.js (v18+)
- MySQL Server (running locally or remotely)

## MySQL & Database Setup

1. Make sure your MySQL server is running (e.g., via MySQL Workbench, XAMPP, or system service).
2. Create your database:
   ```sql
   CREATE DATABASE zuvyko;
   ```

3. Update `.env` with your MySQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="mysql://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>"
   # Example:
   # DATABASE_URL="mysql://root:password@localhost:3306/zuvyko"
   ```

## Prisma Commands

- **Generate Prisma Client**:
  ```bash
  npm run prisma:generate
  ```
- **Sync schema to database (prototyping/development)**:
  ```bash
  npm run prisma:push
  ```
- **Create and apply migrations**:
  ```bash
  npm run prisma:migrate -- --name init
  ```
- **Open Prisma Studio (visual database GUI)**:
  ```bash
  npm run prisma:studio
  ```

## Running the Backend

- Development mode (with live reload):
  ```bash
  npm run dev
  ```
- Build project:
  ```bash
  npm run build
  ```
- Start production build:
  ```bash
  npm run start
  ```
