<div align="center">

# E-Commerce & Delivery Platform

Plataforma full‑stack unificada de comercio electrónico y sistema de entrega construida con Node.js, Express, MongoDB y Next.js.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![CI — Backend](https://github.com/k4inos1/ecommerce-template/actions/workflows/backend-ci.yml/badge.svg?branch=master)](https://github.com/k4inos1/ecommerce-template/actions/workflows/backend-ci.yml)
[![CI — Frontend](https://github.com/k4inos1/ecommerce-template/actions/workflows/frontend-ci.yml/badge.svg?branch=master)](https://github.com/k4inos1/ecommerce-template/actions/workflows/frontend-ci.yml)
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

Plataforma unificada que integra un sistema completo de comercio electrónico con capacidades de gestión y rastreo de entregas. Incluye catálogo de productos, autenticación JWT, carrito persistente, checkout seguro con múltiples pasarelas de pago (Stripe, Transbank), y un sistema integral de órdenes y entregas con rastreo en tiempo real.

## Características

### 🛒 E-Commerce
- Autenticación con JWT y roles (admin/usuario)
- CRUD de productos con búsqueda y paginación
- Carrito persistente en cliente
- Wishlist (lista de deseos)
- Sistema de reseñas y ratings
- Gestión de cupones y descuentos

### 💳 Pagos
- Integración con Stripe (tarjetas de crédito/débito)
- Integración con Transbank (WebPay)
- Webhooks para confirmación de transacciones

### 📦 Entregas
- Gestión integral de órdenes
- Rastreo de entregas en tiempo real
- Notificaciones de estatus de entrega
- Integración con sistemas de logística

### 🔧 Administración
- Panel administrativo para productos, órdenes y cupones
- Gestión de usuarios
- Reportes de ventas y entregas
- Soporte al cliente integrado

### 🎨 Frontend
- UI responsive con Tailwind CSS
- Componentes reutilizables con React
- Optimizado para dispositivos móviles

## Stack

- **Backend:** Node.js 20+, Express, MongoDB, Mongoose, TypeScript
- **Frontend:** Next.js 16, React 18, Tailwind CSS
- **Pagos:** Stripe, Transbank
- **Media:** Cloudinary
- **Auth:** JWT, Passport (OAuth: Google, Facebook)
- **Email:** Nodemailer

## Arquitectura

```
ecommerce-delivery-app/
├── backend/                    # API REST (Puerto :4000)
│   └── src/
│       ├── models/             # User, Product, Order, Notification, Support
│       ├── routes/             # /auth /products /orders /notifications /delivery
│       ├── middleware/         # JWT protect + adminOnly guard
│       ├── services/           # Stripe, Transbank, Cloudinary, Email
│       └── index.ts            # Express entry point
└── frontend/                   # Next.js App (Puerto :3000)
    └── app/
        ├── page.tsx            # Home
        ├── products/           # Listing + filtros + búsqueda
        ├── products/[id]/      # Detalle con galería y ratings
        ├── cart/               # Carrito
        ├── checkout/           # Checkout
        └── orders/             # Mis órdenes + rastreo
```

## Requisitos

- Node.js **>= 20.19.0**
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

## Datos de demostración

```bash
cd backend
npx ts-node src/config/seed.ts
```

Esto crea 8 productos y cuentas demo:

- `admin@platform.cl` / `admin123456`
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
npm run dev:backend
npm run dev:frontend

# Build
npm run build --workspace=backend
npm run build --workspace=frontend
```

## API

### 🔐 Autenticación
- `POST /api/auth/register` — Registro de usuarios
- `POST /api/auth/login` — Inicio de sesión

### 🛍️ Productos
- `GET /api/products` — Listar productos (con paginación, búsqueda, filtros)
- `GET /api/products/:id` — Detalle de producto
- `POST /api/products` — Crear producto (admin)
- `PATCH /api/products/:id` — Actualizar producto (admin)
- `DELETE /api/products/:id` — Eliminar producto (admin)

### 📦 Órdenes & Entregas
- `POST /api/orders` — Crear orden
- `GET /api/orders/my` — Mis órdenes
- `GET /api/orders/:id` — Detalle de orden con rastreo
- `PATCH /api/orders/:id/status` — Actualizar estado (admin)
- `GET /api/notifications` — Notificaciones de entregas (últimas 30 notificaciones)
- `PATCH /api/notifications/:id/read` — Marcar notificación como leída

### 💳 Pagos
- `POST /api/stripe/create-intent` — Crear intent de pago con Stripe
- `POST /api/stripe/webhook` — Webhook de Stripe
- `POST /api/transbank/init` — Iniciar pago con Transbank
- `POST /api/transbank/commit` — Confirmar pago Transbank

### 🎯 Cupones
- `POST /api/coupons/validate` — Validar cupón
- `GET /api/coupons` — Listar cupones (admin)
- `POST /api/coupons` — Crear cupón (admin)
- `PATCH /api/coupons/:id` — Actualizar cupón (admin)
- `DELETE /api/coupons/:id` — Eliminar cupón (admin)

### ⭐ Reseñas
- `GET /api/reviews` — Listar reseñas de producto
- `POST /api/reviews` — Crear reseña
- `PATCH /api/reviews/:id` — Actualizar reseña
- `DELETE /api/reviews/:id` — Eliminar reseña

### 💬 Soporte
- `POST /api/support` — Crear ticket de soporte
- `GET /api/support` — Listar tickets (admin)
- `PATCH /api/support/:id` — Actualizar ticket

### 👥 Usuarios
- `GET /api/users/profile` — Mi perfil
- `PATCH /api/users/profile` — Actualizar perfil
- `DELETE /api/users/:id` — Eliminar cuenta (admin)

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
