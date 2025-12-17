// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apexmotors.ae' },
    update: {},
    create: {
      email: 'admin@apexmotors.ae',
      password: adminPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create vehicles
  const vehicles = [
    {
      name: 'Lamborghini Huracán EVO',
      brand: 'Lamborghini',
      category: 'SUPERCAR',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80'],
      specs: { speed: '325 km/h', acceleration: '2.9s', seats: 2, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['V10 Engine', 'All-Wheel Drive', 'Launch Control', 'Carbon Ceramic Brakes'],
    },
    {
      name: 'Ferrari 488 GTB',
      brand: 'Ferrari',
      category: 'SUPERCAR',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'],
      specs: { speed: '330 km/h', acceleration: '3.0s', seats: 2, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['Twin-Turbo V8', 'F1 Dual-Clutch', 'Magnetic Suspension', 'Racing Mode'],
    },
    {
      name: 'Rolls-Royce Ghost',
      brand: 'Rolls-Royce',
      category: 'LUXURY',
      price: 2800,
      image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80'],
      specs: { speed: '250 km/h', acceleration: '4.8s', seats: 5, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['Starlight Headliner', 'Massage Seats', 'Night Vision', 'Champagne Cooler'],
    },
    {
      name: 'Bentley Continental GT',
      brand: 'Bentley',
      category: 'LUXURY',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'],
      specs: { speed: '333 km/h', acceleration: '3.7s', seats: 4, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['W12 Engine', 'Rotating Display', 'Diamond Quilting', 'Naim Audio'],
    },
    {
      name: 'Mercedes-AMG G63',
      brand: 'Mercedes',
      category: 'SUV',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=800&q=80'],
      specs: { speed: '220 km/h', acceleration: '4.5s', seats: 5, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['V8 Biturbo', '3 Differential Locks', 'Designo Interior', 'Burmester Sound'],
    },
    {
      name: 'Porsche 911 Turbo S',
      brand: 'Porsche',
      category: 'SUPERCAR',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80'],
      specs: { speed: '330 km/h', acceleration: '2.7s', seats: 4, fuel: 'Petrol', transmission: 'PDK' },
      features: ['Flat-6 Turbo', 'PASM Sport', 'Sport Chrono', 'Carbon Roof'],
    },
    {
      name: 'Range Rover Autobiography',
      brand: 'Land Rover',
      category: 'SUV',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80'],
      specs: { speed: '250 km/h', acceleration: '5.4s', seats: 5, fuel: 'Petrol', transmission: 'Automatic' },
      features: ['Executive Class Seats', 'Pixel LED', 'Terrain Response', 'Meridian Signature'],
    },
    {
      name: 'McLaren 720S',
      brand: 'McLaren',
      category: 'SUPERCAR',
      price: 3800,
      image: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1621135802920-133df287f89c?w=800&q=80'],
      specs: { speed: '341 km/h', acceleration: '2.9s', seats: 2, fuel: 'Petrol', transmission: 'SSG' },
      features: ['Twin-Turbo V8', 'Dihedral Doors', 'Variable Drift Control', 'Track Telemetry'],
    },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.name.toLowerCase().replace(/\s+/g, '-') },
      update: vehicle,
      create: { id: vehicle.name.toLowerCase().replace(/\s+/g, '-'), ...vehicle },
    });
  }
  console.log(`✅ ${vehicles.length} vehicles created`);

  // Create coupons
  const coupons = [
    { code: 'WELCOME20', discount: 20, type: 'PERCENT', minOrder: 1000 },
    { code: 'LUXURY500', discount: 500, type: 'FIXED', minOrder: 3000 },
    { code: 'VIP10', discount: 10, type: 'PERCENT', minOrder: 5000 },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }
  console.log(`✅ ${coupons.length} coupons created`);

  // Create locations
  const locations = [
    { name: 'Dubai Marina', address: 'Marina Walk, Dubai Marina', lat: 25.0805, lng: 55.1403 },
    { name: 'Downtown Dubai', address: 'Sheikh Mohammed bin Rashid Blvd', lat: 25.1972, lng: 55.2744 },
    { name: 'Palm Jumeirah', address: 'The Pointe, Palm Jumeirah', lat: 25.1124, lng: 55.1390 },
    { name: 'Dubai Airport T3', address: 'Terminal 3, DXB Airport', lat: 25.2532, lng: 55.3657 },
    { name: 'JBR Beach', address: 'The Walk, JBR', lat: 25.0789, lng: 55.1345 },
    { name: 'Business Bay', address: 'Bay Square, Business Bay', lat: 25.1850, lng: 55.2650 },
  ];

  for (const location of locations) {
    await prisma.location.upsert({
      where: { id: location.name.toLowerCase().replace(/\s+/g, '-') },
      update: location,
      create: { id: location.name.toLowerCase().replace(/\s+/g, '-'), ...location },
    });
  }
  console.log(`✅ ${locations.length} locations created`);

  // Create extras
  const extras = [
    { id: 'chauffeur', name: 'Professional Chauffeur', nameAr: 'سائق محترف', price: 500 },
    { id: 'insurance', name: 'Full Insurance', nameAr: 'تأمين شامل', price: 200 },
    { id: 'gps', name: 'GPS Navigation', nameAr: 'نظام ملاحة', price: 50 },
    { id: 'baby_seat', name: 'Baby Seat', nameAr: 'مقعد طفل', price: 75 },
    { id: 'wifi', name: 'Portable WiFi', nameAr: 'واي فاي متنقل', price: 30 },
  ];

  for (const extra of extras) {
    await prisma.extra.upsert({
      where: { id: extra.id },
      update: extra,
      create: extra,
    });
  }
  console.log(`✅ ${extras.length} extras created`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
