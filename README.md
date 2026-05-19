<div align="center">

# TechStore — E-Commerce & Delivery Platform

Plataforma full‑stack unificada de comercio electrónico y delivery construida con Node.js, Express, MongoDB, Next.js y React + Vite.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![CI — Backend](https://github.com/k4inos1/ecommerce-platform/actions/workflows/backend-ci.yml/badge.svg?branch=master)](https://github.com/k4inos1/ecommerce-platform/actions/workflows/backend-ci.yml)
[![CI — Frontend](https://github.com/k4inos1/ecommerce-platform/actions/workflows/frontend-ci.yml/badge.svg?branch=master)](https://github.com/k4inos1/ecommerce-platform/actions/workflows/frontend-ci.yml)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=flat-square)](LICENSE)

</div>

## Tabla de contenidos

- [Resumen](#resumen)
- [Características](#características)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Datos de demostración](#datos-de-demostración)
- [Variables de entorno](#variables-de-entorno)
- [Scripts útiles](#scripts-útiles)
- [API](#api)
- [Despliegue](#despliegue)
- [Contribución](#contribución)
- [Código de conducta](#código-de-conducta)
- [Licencia](#licencia)
- [Autor](#autor)

## Resumen

TechStore es una plataforma unificada que combina dos aplicaciones:
1. **E-Commerce** — Tienda online con backend Express, frontend Next.js, catálogo de productos, autenticación JWT, carrito persistente, checkout con Stripe y panel administrativo.
2. **Delivery** — Aplicación de pedidos y delivery construida con React + Vite, Firebase, integración con WhatsApp y panel administrativo independiente.

## Características

- Autenticación con JWT y roles (admin/usuario)
- CRUD de productos con búsqueda y paginación
- Carrito persistente en cliente
- Checkout con Stripe y soporte para Transbank (modo integración/producción)
- Subida de imágenes vía Cloudinary
- Panel administrativo para productos, órdenes y cupones
- UI responsive con Tailwind CSS

## Stack

### E-Commerce
- **Backend:** Node.js 20+, Express, MongoDB, Mongoose, TypeScript
- **Frontend:** Next.js 16, React 18, Tailwind CSS
- **Pagos:** Stripe, Transbank
- **Media:** Cloudinary

### Delivery
- **Frontend:** React 19, Vite, TypeScript
- **Backend:** Firebase (Firestore, Authentication)
- **Routing:** React Router v7
- **Checkout:** WhatsApp integration

## Arquitectura

```
ecommerce-platform/
├── backend/                    # E-Commerce API REST (Puerto :4000)
│   └── src/
│       ├── models/             # User, Product, Order (Mongoose)
│       ├── routes/             # /auth /products /orders
│       ├── middleware/         # JWT protect + adminOnly guard
│       ├── services/           # Stripe, Transbank, Cloudinary
│       └── index.ts            # Express entry point
├── frontend/                   # E-Commerce Next.js App (Puerto :3000)
│   └── app/
│       ├── page.tsx            # Home
│       ├── products/           # Listing + filtros + búsqueda
│       ├── products/[id]/      # Detalle con galería y ratings
│       ├── cart/               # Carrito
│       └── checkout/           # Checkout
└── delivery/                   # Delivery React + Vite App (Puerto :5173)
    └── src/
        ├── App.tsx             # Main app component
        ├── main.tsx            # Entry point with routing
        ├── firebase.ts         # Firebase configuration
        ├── components/         # Shared UI components
        ├── pages/              # AdminRoute, AdminLogin, AdminPanel
        └── data/               # Product catalog and services
```

## Requisitos

- Node.js **>= 20**
- npm **>= 10**
- MongoDB **>= 6** (local o Atlas)

## Instalación y puesta en marcha

### 1) Instalar dependencias

```bash
npm install
```

### 2) Backend

```bash
cp backend/.env.example backend/.env
# editar variables de entorno
npm run dev --workspace=backend
```

### 3) Frontend

```bash
cp frontend/.env.local.example frontend/.env.local
# editar NEXT_PUBLIC_API_URL
npm run dev --workspace=frontend
```

### 4) Delivery (opcional)

```bash
# Configurar Firebase en delivery/src/firebase.ts
npm run dev --workspace=delivery
```

## Datos de demostración

```bash
cd backend
npx ts-node src/config/seed.ts
```

Esto crea 8 productos y cuentas demo:

- `admin@techstore.cl` / `admin123456`
- `user@test.cl` / `user123456`

## Variables de entorno

### Backend — `backend/.env`

| Variable | Descripción | Obligatoria |
| --- | --- | --- |
| `PORT` | Puerto del servidor | Sí |
| `MONGODB_URI` | URI de MongoDB | Sí |
| `JWT_SECRET` | Secreto JWT | Sí |
| `CLIENT_URL` | URL del frontend | Sí |
| `STRIPE_SECRET_KEY` | Llave secreta Stripe | No |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe | No |
| `TRANSBANK_COMMERCE_CODE` | Commerce code Transbank | No |
| `TRANSBANK_API_KEY` | API key Transbank | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No |
| `FACEBOOK_APP_ID` | Facebook App ID | No |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | No |
| `EMAIL_USER` | Usuario SMTP | No |
| `EMAIL_PASS` | Password SMTP | No |

### Frontend — `frontend/.env.local`

| Variable | Descripción | Obligatoria |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL del backend | Sí |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | No |

## Scripts útiles

```bash
# Desarrollo
npm run dev:backend      # Inicia el servidor Express (puerto 4000)
npm run dev:frontend     # Inicia Next.js (puerto 3000)
npm run dev:delivery     # Inicia Vite delivery app (puerto 5173)

# Build
npm run build --workspace=backend
npm run build --workspace=frontend
npm run build --workspace=delivery
```

## API

Rutas principales:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/my`

Revisa `backend/src/routes` para el detalle completo de endpoints.

## Despliegue

- **Backend:** Railway (`nixpacks.toml`, `railway.json`)
- **Frontend:** Vercel
- **CI:** GitHub Actions para type-check y builds

## Contribución

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de trabajo recomendado.

## Código de conducta

Este proyecto adopta el [Código de Conducta](CODE_OF_CONDUCT.md).

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).

## Autor

**Ricardo Sanhueza** — Full Stack Developer  
Concepción, Chile · 📧 ricardosanhuezaacuna@gmail.com  
Portfolio: https://v0-k4inos1.vercel.app · GitHub: https://github.com/k4inos1
