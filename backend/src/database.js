const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const dbFile = path.resolve(__dirname, '..', 'data', 'factori_db.json')

// Default seed data matching the assignment requirements
function getInitialSeed() {
  return {
    retailers: [
      {
        id: 'ret_zolara',
        name: 'Zolara',
        domain: 'zolara.in',
        storefrontUrl: 'https://zolara.in',
        ownerName: 'Sunita Mehra',
        ownerEmail: 'sunita@zolara.in',
        phone: '+91 98201 12345',
        deliveredOrders: 642,
        settledGmv: 384500, // ₹3.84 Lakh -> UNLOCKED (>500 orders & >₹2.5L)
        appVersion: '1.0.0',
        latestAvailableVersion: '1.1.0',
        appStatus: 'active',
        packageId: 'com.factori.zolara.app',
      },
      {
        id: 'ret_armella',
        name: 'Armella',
        domain: 'armella.in',
        storefrontUrl: 'https://armella.in',
        ownerName: 'Kavita Chawla',
        ownerEmail: 'orders@armella.in',
        phone: '+91 98112 54321',
        deliveredOrders: 1250,
        settledGmv: 840000, // ₹8.4 Lakh -> UNLOCKED
        appVersion: '1.0.0',
        latestAvailableVersion: '1.0.0',
        appStatus: 'active',
        packageId: 'com.factori.armella.app',
      },
      {
        id: 'ret_jaipur_silks',
        name: 'Jaipur Silks',
        domain: 'jaipursilks.factori.com',
        storefrontUrl: 'https://jaipursilks.factori.com',
        ownerName: 'Rajesh Verma',
        ownerEmail: 'rajesh@jaipursilks.in',
        phone: '+91 99820 98765',
        deliveredOrders: 480, // Exactly 480 orders -> LOCKED (Needs 20 more to unlock!)
        settledGmv: 210000,   // ₹2.1 Lakh (< ₹2.5L)
        appVersion: null,
        latestAvailableVersion: '1.1.0',
        appStatus: 'locked',
        packageId: null,
      },
    ],
    customers: [
      {
        id: 'cust_101',
        retailerId: 'ret_zolara',
        name: 'Priya Sharma',
        phone: '+91 98765 43210',
        email: 'priya.s@gmail.com',
        totalOrders: 6,
        totalSpend: 14200,
        createdAt: '2024-03-12T10:30:00Z',
      },
      {
        id: 'cust_102',
        retailerId: 'ret_zolara',
        name: 'Ananya Verma',
        phone: '+91 98123 45678',
        email: 'ananya.v@outlook.com',
        totalOrders: 3,
        totalSpend: 7800,
        createdAt: '2024-04-05T14:15:00Z',
      },
      {
        id: 'cust_103',
        retailerId: 'ret_zolara',
        name: 'Deepika Iyer',
        phone: '+91 97654 32109',
        email: 'deepika.iyer@yahoo.com',
        totalOrders: 9,
        totalSpend: 23500,
        createdAt: '2024-01-20T09:00:00Z',
      },
      {
        id: 'cust_104',
        retailerId: 'ret_zolara',
        name: 'Rohit Gupta',
        phone: '+91 99887 76655',
        email: 'rohit.gupta@gmail.com',
        totalOrders: 1,
        totalSpend: 2499,
        createdAt: '2024-05-18T16:45:00Z',
      },
      {
        id: 'cust_201',
        retailerId: 'ret_armella',
        name: 'Sneha Kulkarni',
        phone: '+91 98220 11223',
        email: 'sneha.k@gmail.com',
        totalOrders: 4,
        totalSpend: 11200,
        createdAt: '2024-02-14T11:20:00Z',
      },
    ],
    appDevices: [
      {
        id: 'dev_01',
        retailerId: 'ret_zolara',
        customerId: 'cust_101',
        phone: '+91 98765 43210',
        platform: 'Android 14 (Pixel 7)',
        installedAt: '2024-04-10T12:00:00Z',
        loggedInAt: '2024-04-10T12:05:00Z',
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
        status: 'active', // active, inactive, uninstalled
        fcmToken: 'fcm_token_zolara_priya_sharma_98765',
      },
      {
        id: 'dev_02',
        retailerId: 'ret_zolara',
        customerId: 'cust_102',
        phone: '+91 98123 45678',
        platform: 'Android 13 (Samsung S21)',
        installedAt: '2024-04-15T09:30:00Z',
        loggedInAt: '2024-04-15T09:35:00Z',
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        status: 'active',
        fcmToken: 'fcm_token_zolara_ananya_verma_45678',
      },
      {
        id: 'dev_03',
        retailerId: 'ret_zolara',
        customerId: 'cust_103',
        phone: '+91 97654 32109',
        platform: 'Android 14 (OnePlus 11)',
        installedAt: '2024-03-01T15:00:00Z',
        loggedInAt: '2024-03-01T15:10:00Z',
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        status: 'active',
        fcmToken: 'fcm_token_zolara_deepika_iyer_32109',
      },
      {
        id: 'dev_04',
        retailerId: 'ret_zolara',
        customerId: 'cust_104',
        phone: '+91 99887 76655',
        platform: 'Android 12 (Redmi Note 10)',
        installedAt: '2024-05-20T18:00:00Z',
        loggedInAt: '2024-05-20T18:04:00Z',
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
        status: 'uninstalled', // detected via FCM registration-token-not-registered bounce
        fcmToken: 'fcm_token_zolara_rohit_dead_token',
      },
      {
        id: 'dev_05',
        retailerId: 'ret_armella',
        customerId: 'cust_201',
        phone: '+91 98220 11223',
        platform: 'Android 14 (Samsung A54)',
        installedAt: '2024-03-10T14:00:00Z',
        loggedInAt: '2024-03-10T14:10:00Z',
        lastActiveAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        status: 'active',
        fcmToken: 'fcm_token_armella_sneha_kulkarni',
      },
    ],
    pushCampaigns: [
      {
        id: 'camp_01',
        retailerId: 'ret_zolara',
        title: 'Festive Flash Sale: 20% Off Kurtis!',
        body: 'Handcrafted Chikankari Kurtis back in stock. Tap to view collection.',
        targetUrl: 'https://zolara.in/products/embroidered-anarkali-kurti',
        targetedCount: 3,
        deliveredCount: 3,
        sentAt: '2024-05-22T10:00:00Z',
      },
    ],
    builds: [],
  }
}

class FactoriDatabase {
  constructor() {
    this.ensureDataDirectory()
    this.data = this.loadData()
  }

  ensureDataDirectory() {
    const dir = path.dirname(dbFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  loadData() {
    try {
      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing seed:', e.message)
    }
    const seed = getInitialSeed()
    this.saveData(seed)
    return seed
  }

  saveData(data = this.data) {
    try {
      const tempFile = `${dbFile}.tmp`
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8')
      fs.renameSync(tempFile, dbFile)
    } catch (e) {
      console.error('Error persisting database:', e.message)
    }
  }

  // Retailer Queries
  listRetailers() {
    return this.data.retailers.map((r) => {
      const isEligible = r.deliveredOrders >= 500 || r.settledGmv >= 250000
      const orderProgressPct = Math.min(100, Math.round((r.deliveredOrders / 500) * 100))
      return {
        ...r,
        isEligible,
        orderProgressPct,
        remainingOrders: Math.max(0, 500 - r.deliveredOrders),
      }
    })
  }

  getRetailer(id) {
    return this.listRetailers().find((r) => r.id === id || r.domain === id || r.name.toLowerCase() === id.toLowerCase()) || null
  }

  // App Users / Customers (Ties into customer table as required in brief)
  getAppUsers(retailerId) {
    const retailer = this.getRetailer(retailerId)
    if (!retailer) return []

    const devices = this.data.appDevices.filter((d) => d.retailerId === retailer.id)
    return devices.map((d) => {
      const customer = this.data.customers.find((c) => c.id === d.customerId) || {
        name: 'Guest Customer',
        email: 'N/A',
        totalOrders: 0,
        totalSpend: 0,
      }
      return {
        deviceId: d.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        phone: d.phone,
        platform: d.platform,
        installedAt: d.installedAt,
        loggedInAt: d.loggedInAt,
        lastActiveAt: d.lastActiveAt,
        status: d.status,
        totalOrders: customer.totalOrders,
        totalSpend: customer.totalSpend,
      }
    })
  }

  // Push Notifications
  createPushCampaign(retailerId, { title, body, targetUrl }) {
    const retailer = this.getRetailer(retailerId)
    if (!retailer) throw new Error('Retailer not found')

    const activeDevices = this.data.appDevices.filter((d) => d.retailerId === retailer.id && d.status === 'active')
    const campaign = {
      id: `camp_${Date.now()}`,
      retailerId: retailer.id,
      title: title.trim(),
      body: body.trim(),
      targetUrl: targetUrl ? targetUrl.trim() : retailer.storefrontUrl,
      targetedCount: activeDevices.length,
      deliveredCount: activeDevices.length,
      sentAt: new Date().toISOString(),
    }

    this.data.pushCampaigns.unshift(campaign)
    this.saveData()
    return campaign
  }

  listPushCampaigns(retailerId) {
    const retailer = this.getRetailer(retailerId)
    if (!retailer) return []
    return this.data.pushCampaigns.filter((c) => c.retailerId === retailer.id)
  }

  // Device Telemetry (Extra credit & customer identification)
  bindDevice({ retailerId, customerId, phone, deviceId, platform, fcmToken }) {
    let device = this.data.appDevices.find((d) => d.id === deviceId || (d.retailerId === retailerId && d.phone === phone))
    const now = new Date().toISOString()
    if (device) {
      device.customerId = customerId || device.customerId
      device.phone = phone || device.phone
      device.lastActiveAt = now
      device.status = 'active'
      if (fcmToken) device.fcmToken = fcmToken
    } else {
      device = {
        id: deviceId || `dev_${Date.now()}`,
        retailerId,
        customerId: customerId || null,
        phone,
        platform: platform || 'Android 14',
        installedAt: now,
        loggedInAt: customerId ? now : null,
        lastActiveAt: now,
        status: 'active',
        fcmToken: fcmToken || `fcm_${crypto.randomUUID()}`,
      }
      this.data.appDevices.unshift(device)
    }
    this.saveData()
    return device
  }
}

const db = new FactoriDatabase()
module.exports = db

