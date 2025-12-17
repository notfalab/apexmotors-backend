# 🚗 APEX MOTORS - Backend API

Backend completo para la plataforma de renta de autos de lujo.

## 🛠️ Tecnologías

- **Node.js + Express** - Servidor
- **PostgreSQL + Prisma** - Base de datos
- **Stripe** - Pagos
- **JWT** - Autenticación
- **Nodemailer** - Emails

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- Cuenta de Stripe
- Cuenta de email (Gmail, etc.)

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/apex_motors"

# JWT
JWT_SECRET="tu-clave-secreta-muy-larga-y-segura"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### 3. Crear base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:push

# (Opcional) Poblar con datos de ejemplo
npm run db:seed
```

### 4. Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará en: `http://localhost:5000`

## 📚 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener perfil |
| PUT | `/api/auth/profile` | Actualizar perfil |
| PUT | `/api/auth/change-password` | Cambiar contraseña |

### Vehículos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/vehicles` | Listar vehículos |
| GET | `/api/vehicles/:id` | Ver vehículo |
| GET | `/api/vehicles/:id/availability` | Calendario disponibilidad |
| GET | `/api/vehicles/:id/check-availability` | Verificar fechas |
| POST | `/api/vehicles` | Crear (admin) |
| PUT | `/api/vehicles/:id` | Actualizar (admin) |
| DELETE | `/api/vehicles/:id` | Eliminar (admin) |

### Reservaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/bookings` | Crear reservación |
| GET | `/api/bookings/my-bookings` | Mis reservaciones |
| GET | `/api/bookings/:id` | Ver reservación |
| POST | `/api/bookings/:id/confirm-payment` | Confirmar pago |
| POST | `/api/bookings/:id/cancel` | Cancelar |
| GET | `/api/bookings` | Todas (admin) |
| GET | `/api/bookings/stats/dashboard` | Estadísticas (admin) |

### Cupones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/coupons/validate` | Validar cupón |
| GET | `/api/coupons` | Listar (admin) |
| POST | `/api/coupons` | Crear (admin) |
| PUT | `/api/coupons/:id` | Actualizar (admin) |
| DELETE | `/api/coupons/:id` | Eliminar (admin) |

## 🔐 Autenticación

Incluir el token JWT en el header:
```
Authorization: Bearer <token>
```

## 💳 Configurar Stripe

### 1. Obtener claves
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Copia tu **Secret Key** (sk_test_...)

### 2. Configurar Webhook
1. En Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Selecciona eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copia el **Webhook Secret** (whsec_...)

## 📧 Configurar Email (Gmail)

1. Activa 2FA en tu cuenta Google
2. Ve a: Cuenta → Seguridad → App passwords
3. Genera una contraseña de aplicación
4. Usa esa contraseña en `SMTP_PASS`

## 🗄️ Comandos de Base de Datos

```bash
# Ver datos en navegador
npm run db:studio

# Crear migración
npm run db:migrate

# Resetear base de datos
npx prisma migrate reset
```

## 📁 Estructura

```
backend/
├── prisma/
│   ├── schema.prisma    # Modelo de datos
│   └── seed.js          # Datos iniciales
├── src/
│   ├── config/          # Configuración
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Auth, validación
│   ├── routes/          # Rutas API
│   ├── services/        # Stripe, Email
│   └── index.js         # Servidor
├── .env.example
└── package.json
```

## 🚀 Despliegue

### Railway (Recomendado)
1. Crea proyecto en [Railway](https://railway.app)
2. Agrega PostgreSQL
3. Conecta tu repo GitHub
4. Configura variables de entorno
5. Deploy!

### Variables de entorno en producción
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
# ... resto de variables
```

## 👤 Usuario Admin por Defecto

Después de correr `npm run db:seed`:
- Email: `admin@apexmotors.ae`
- Password: `admin123`

---

© 2024 APEX MOTORS
