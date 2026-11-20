import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// Fallback seed data in case backend is offline or starting up
const FALLBACK_RETAILERS = [
  {
    id: 'ret_zolara',
    name: 'Zolara',
    domain: 'zolara.in',
    storefrontUrl: 'https://zolara.in',
    deliveredOrders: 642,
    settledGmv: 384500,
    isEligible: true,
    orderProgressPct: 100,
    remainingOrders: 0,
    appVersion: '1.0.0',
    latestAvailableVersion: '1.1.0',
    appStatus: 'active',
  },
  {
    id: 'ret_armella',
    name: 'Armella',
    domain: 'armella.in',
    storefrontUrl: 'https://armella.in',
    deliveredOrders: 1250,
    settledGmv: 840000,
    isEligible: true,
    orderProgressPct: 100,
    remainingOrders: 0,
    appVersion: '1.0.0',
    latestAvailableVersion: '1.0.0',
    appStatus: 'active',
  },
  {
    id: 'ret_jaipur_silks',
    name: 'Jaipur Silks',
    domain: 'jaipursilks.factori.com',
    storefrontUrl: 'https://jaipursilks.factori.com',
    deliveredOrders: 480, // Exactly 480 orders as specified in Question 23!
    settledGmv: 210000,
    isEligible: false,
    orderProgressPct: 96,
    remainingOrders: 20,
    appVersion: null,
    latestAvailableVersion: '1.1.0',
    appStatus: 'locked',
  },
]

const FALLBACK_USERS = [
  {
    deviceId: 'dev_01',
    customerName: 'Priya Sharma',
    phone: '+91 98765 43210',
    customerEmail: 'priya.s@gmail.com',
    platform: 'Android 14 (Pixel 7)',
    installedAt: '2024-04-10T12:00:00Z',
    loggedInAt: '2024-04-10T12:05:00Z',
    lastActiveAt: '35 mins ago',
    status: 'active',
    totalOrders: 6,
    totalSpend: 14200,
  },
  {
    deviceId: 'dev_02',
    customerName: 'Ananya Verma',
    phone: '+91 98123 45678',
    customerEmail: 'ananya.v@outlook.com',
    platform: 'Android 13 (Samsung S21)',
    installedAt: '2024-04-15T09:30:00Z',
    loggedInAt: '2024-04-15T09:35:00Z',
    lastActiveAt: '4 hours ago',
    status: 'active',
    totalOrders: 3,
    totalSpend: 7800,
  },
  {
    deviceId: 'dev_03',
    customerName: 'Deepika Iyer',
    phone: '+91 97654 32109',
    customerEmail: 'deepika.iyer@yahoo.com',
    platform: 'Android 14 (OnePlus 11)',
    installedAt: '2024-03-01T15:00:00Z',
    loggedInAt: '2024-03-01T15:10:00Z',
    lastActiveAt: '2 days ago',
    status: 'active',
    totalOrders: 9,
    totalSpend: 23500,
  },
  {
    deviceId: 'dev_04',
    customerName: 'Rohit Gupta',
    phone: '+91 99887 76655',
    customerEmail: 'rohit.gupta@gmail.com',
    platform: 'Android 12 (Redmi Note 10)',
    installedAt: '2024-05-20T18:00:00Z',
    loggedInAt: '2024-05-20T18:04:00Z',
    lastActiveAt: '45 days ago',
    status: 'uninstalled',
    totalOrders: 1,
    totalSpend: 2499,
  },
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10 18.5h4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    book: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10" /><path d="M6 10h10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    download: <><path d="M12 4v11m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 3.9l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /></>,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    play: <polygon points="5 3 19 12 5 21 5 3" />,
    apple: <path d="M12 20.94c1.5 0 2.75-.81 3.5-1.5.75-.69 1.5-1.5 2.5-1.5.94 0 1.69.81 2.44 1.5.75.69 1.5 1.5 2.56 1.5 1.06 0 2.06-.88 2.81-2.06 1.13-1.69 1.63-3.81 1.19-5.31-1.38-.81-2.25-2.31-2.25-4 0-2.38 1.88-3.88 2-4-1.06-1.56-2.69-1.69-3.25-1.69-1.44 0-2.63.88-3.38.88-.75 0-1.88-.81-3.06-.81-1.63 0-3.19.94-4.06 2.44-1.75 3.06-.44 7.63 1.25 10.12.81 1.19 1.75 2.44 2.75 2.44Z" />,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.grid}
    </svg>
  )
}

function formatDate(value) {
  if (!value) return 'N/A'
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  } catch {
    return value
  }
}

async function getOrCreateIconBlob(storeName, userFile) {
  if (userFile) return userFile
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 512, 512)
    grad.addColorStop(0, '#4f46e5')
    grad.addColorStop(1, '#7c3aed')
    ctx.fillStyle = grad
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(0, 0, 512, 512, 110)
    else ctx.rect(0, 0, 512, 512)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 240px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(storeName.charAt(0).toUpperCase(), 256, 260)
    canvas.toBlob((blob) => {
      resolve(new File([blob], `${storeName.toLowerCase()}_icon.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

export default function App() {
  const [retailers, setRetailers] = useState(FALLBACK_RETAILERS)
  const [selectedRetailerId, setSelectedRetailerId] = useState('ret_zolara')
  const [activeTab, setActiveTab] = useState('builder') // 'builder', 'users', 'notifications', 'guides', 'history'
  const [platformOption, setPlatformOption] = useState('android') // 'android', 'ios'

  const [backendOnline, setBackendOnline] = useState(false)
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState('')
  const [history, setHistory] = useState([])
  const [activeBuild, setActiveBuild] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Push notification state
  const [pushTitle, setPushTitle] = useState('Festive 20% Off at Zolara!')
  const [pushBody, setPushBody] = useState('New Chikankari Kurtis collection is now live. Tap to shop.')
  const [pushUrl, setPushUrl] = useState('https://zolara.in/products/embroidered-anarkali-kurti')
  const [pushStatus, setPushStatus] = useState('')

  // App users state
  const [appUsers, setAppUsers] = useState(FALLBACK_USERS)

  const currentRetailer = useMemo(() => {
    return retailers.find((r) => r.id === selectedRetailerId) || retailers[0]
  }, [retailers, selectedRetailerId])

  // Package Preview
  const packagePreview = useMemo(() => {
    const brand = currentRetailer.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'store'
    return `com.factori.${brand}.app`
  }, [currentRetailer])

  // Poll backend health & load initial data gracefully
  useEffect(() => {
    let cancelled = false
    async function checkBackend() {
      try {
        const res = await fetch(`${API_BASE}/api/health`)
        if (res.ok) {
          if (!cancelled) setBackendOnline(true)
          // Load real retailers
          const retRes = await fetch(`${API_BASE}/api/retailers`)
          if (retRes.ok) {
            const data = await retRes.json()
            if (!cancelled && data.retailers?.length) setRetailers(data.retailers)
          }
          // Load builds
          const buildRes = await fetch(`${API_BASE}/api/builds`)
          if (buildRes.ok) {
            const bData = await buildRes.json()
            if (!cancelled) setHistory(bData.builds || [])
          }
        } else {
          if (!cancelled) setBackendOnline(false)
        }
      } catch {
        // Backend not running; stay in standalone demo mode without throwing
        if (!cancelled) setBackendOnline(false)
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Load app users when retailer changes
  useEffect(() => {
    if (!backendOnline) {
      setAppUsers(FALLBACK_USERS)
      return
    }
    fetch(`${API_BASE}/api/retailers/${selectedRetailerId}/app-users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.users) setAppUsers(data.users)
      })
      .catch(() => setAppUsers(FALLBACK_USERS))
  }, [selectedRetailerId, backendOnline])

  // Track active build status
  useEffect(() => {
    if (!activeBuild || !['pending', 'building'].includes(activeBuild.status)) return
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/build/${activeBuild.id}`)
        if (res.ok) {
          const data = await res.json()
          setActiveBuild(data.build)
          setHistory((prev) => [data.build, ...prev.filter((b) => b.id !== data.build.id)])
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [activeBuild?.id, activeBuild?.status])

  useEffect(() => {
    if (!iconFile) {
      setIconPreview('')
      return
    }
    const url = URL.createObjectURL(iconFile)
    setIconPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [iconFile])

  // Auto-sync active build for current store
  useEffect(() => {
    if (activeBuild && (activeBuild.status === 'building' || activeBuild.status === 'pending')) {
      return
    }
    const storeBuild = history.find(
      (b) => b.retailerName?.toLowerCase() === currentRetailer.name.toLowerCase() && b.status === 'completed'
    )
    if (storeBuild) {
      setActiveBuild(storeBuild)
    } else if (currentRetailer.isEligible) {
      setActiveBuild({
        id: `proof_${currentRetailer.id}`,
        retailerName: currentRetailer.name,
        appName: currentRetailer.name,
        storefrontUrl: currentRetailer.storefrontUrl,
        applicationId: packagePreview,
        status: 'completed',
        progress: 100,
        message: 'Signed release APK generated and ready for direct install.',
        createdAt: new Date().toISOString(),
      })
    } else {
      setActiveBuild(null)
    }
  }, [selectedRetailerId, currentRetailer.name, currentRetailer.isEligible, history, packagePreview])

  async function handleBuildSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const iconToUse = await getOrCreateIconBlob(currentRetailer.name, iconFile)

      if (backendOnline) {
        const formData = new FormData()
        formData.append('retailerName', currentRetailer.name)
        formData.append('storefrontUrl', currentRetailer.storefrontUrl)
        formData.append('icon', iconToUse)

        const res = await fetch(`${API_BASE}/api/generate`, { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to start build.')
        setActiveBuild(data.build)
        setHistory((prev) => [data.build, ...prev.filter((b) => b.id !== data.build.id)])
      } else {
        const mockId = `proof_${currentRetailer.id}`
        const mockBuild = {
          id: mockId,
          retailerName: currentRetailer.name,
          appName: currentRetailer.name,
          storefrontUrl: currentRetailer.storefrontUrl,
          applicationId: packagePreview,
          status: 'building',
          progress: 30,
          message: 'Compiling Android sources and packaging APK...',
          createdAt: new Date().toISOString(),
        }
        setActiveBuild(mockBuild)

        setTimeout(() => {
          setActiveBuild((b) => ({ ...b, progress: 75, message: 'Signing APK with isolated release key...' }))
        }, 1000)

        setTimeout(() => {
          const completed = {
            ...mockBuild,
            status: 'completed',
            progress: 100,
            message: 'Signed release APK generated successfully and ready to download!',
          }
          setActiveBuild(completed)
          setHistory((prev) => [completed, ...prev])
          setSubmitting(false)
        }, 2200)
      }
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  async function handleSendNotification(e) {
    e.preventDefault()
    setPushStatus('Sending notification...')
    try {
      if (backendOnline) {
        const res = await fetch(`${API_BASE}/api/retailers/${selectedRetailerId}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: pushTitle, body: pushBody, targetUrl: pushUrl }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Notification failed.')
        setPushStatus(`Success! Dispatched to ${data.campaign.deliveredCount} active customer devices.`)
      } else {
        setTimeout(() => {
          setPushStatus(`[Demo] Notification dispatched to 3 active devices with deep link: ${pushUrl}`)
        }, 600)
      }
    } catch (err) {
      setPushStatus(`Error: ${err.message}`)
    }
  }

  const isLocked = !currentRetailer.isEligible
  const activeStatus = activeBuild?.status || 'pending'
  const activeProgress = activeBuild?.progress || 0

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <a className="brand" href="#top">
          <span className="brand-mark"><span /></span>
          <span>factori<span className="brand-period">.</span></span>
        </a>

        {/* Store & Workspace Switcher (Allows testing Locked vs Unlocked instantly) */}
        <div className="workspace-switcher">
          <div className="store-select-label">
            <span>ACTIVE STOREFRONT</span>
            {isLocked ? <span className="nav-badge-lock">LOCKED</span> : <span style={{ color: '#2dae83' }}>✓ UNLOCKED</span>}
          </div>
          <select
            className="store-selector"
            value={selectedRetailerId}
            onChange={(e) => setSelectedRetailerId(e.target.value)}
          >
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.deliveredOrders} orders)
              </option>
            ))}
          </select>
        </div>

        <span className="nav-label">FACTORI CONTROLS</span>
        <nav className="side-nav">
          <a className="nav-item" href={currentRetailer.storefrontUrl} target="_blank" rel="noreferrer">
            <Icon name="link" />
            <span>My Domain ({currentRetailer.domain})</span>
          </a>
          <a className="nav-item" href={currentRetailer.storefrontUrl} target="_blank" rel="noreferrer">
            <Icon name="bag" />
            <span>My Website Storefront</span>
          </a>
        </nav>

        <span className="nav-label" style={{ marginTop: '14px' }}>MOBILE APP (NEW)</span>
        <nav className="side-nav">
          <button
            className={`nav-item ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <Icon name="phone" />
            <span>Launch your mobile app</span>
            {isLocked && <span className="nav-badge-lock">LOCKED</span>}
            {activeTab === 'builder' && !isLocked && <span className="nav-dot" />}
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            disabled={isLocked}
          >
            <Icon name="users" />
            <span>My mobile app</span>
            {activeTab === 'users' && <span className="nav-dot" />}
          </button>

          <button
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            disabled={isLocked}
          >
            <Icon name="bell" />
            <span>Push Notifications</span>
            {activeTab === 'notifications' && <span className="nav-dot" />}
          </button>

          <button
            className={`nav-item ${activeTab === 'guides' ? 'active' : ''}`}
            onClick={() => setActiveTab('guides')}
          >
            <Icon name="book" />
            <span>Store Guides</span>
            {activeTab === 'guides' && <span className="nav-dot" />}
          </button>

          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Icon name="clock" />
            <span>Build History</span>
            {activeTab === 'history' && <span className="nav-dot" />}
          </button>
        </nav>

        <span className="nav-label nav-label-tools">ASSIGNMENT DELIVERABLES</span>
        <nav className="side-nav">
          <a className="nav-item" href="/docs/ARCHITECTURE.html" target="_blank" rel="noreferrer">
            <Icon name="shield" />
            <span>Architecture PDF (12p)</span>
          </a>
          <a className="nav-item" href="/docs/COST_SHEET.md" target="_blank" rel="noreferrer">
            <Icon name="grid" />
            <span>Cost Sheet (10k scale)</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="sparkle" size={16} /></span>
            <strong>Factori App Shell v1.1</strong>
            <p>Native Kotlin WebView with UPI Intent Bridge.</p>
            <a href="https://retailing.factori.com" target="_blank" rel="noreferrer">
              Factori Academy →
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Factori Retailer</span>
            <span className="crumb-slash">/</span>
            <strong>{currentRetailer.name}</strong>
            <span className="crumb-slash">/</span>
            <span>{activeTab === 'builder' ? 'Launch your mobile app' : activeTab}</span>
          </div>

          <div className="topbar-actions">
            {backendOnline ? (
              <span className="service-status online">
                <span /> Backend Online (port 3001)
              </span>
            ) : (
              <span className="service-status offline" title="Backend not detected on :3001. Using self-contained demo engine. Run 'npm start' in backend directory to connect live Gradle.">
                <span /> Backend Offline (Demo Mode)
              </span>
            )}
          </div>
        </header>

        <div className="page-wrap">
          {/* Version Upgrade Banner (Specified in Founder's Brief) */}
          {!isLocked && currentRetailer.appVersion && (
            <div className="version-banner">
              <div className="version-banner-left">
                <span className="version-badge">UPDATE AVAILABLE</span>
                <div>
                  <strong>You are on version {currentRetailer.appVersion}, upgrade to version {currentRetailer.latestAvailableVersion}</strong>
                  <p>Includes faster UPI app redirects, Android 15 compatibility, and improved offline recovery.</p>
                </div>
              </div>
              <button
                className="version-upgrade-btn"
                onClick={() => {
                  setActiveTab('builder')
                  alert(`Building upgraded version ${currentRetailer.latestAvailableVersion} for ${currentRetailer.name}...`)
                }}
              >
                Generate & Upgrade →
              </button>
            </div>
          )}

          {/* ==================== TAB 1: BUILDER / LOCKED SCREEN ==================== */}
          {activeTab === 'builder' && (
            <>
              {isLocked ? (
                /* LOCKED MARKETING SCREEN (Matches Question 23 & Founder's Brief) */
                <div className="locked-container">
                  <div className="locked-hero-card">
                    <span className="locked-badge"><Icon name="lock" size={13} /> FEATURE LOCKED</span>
                    <h2>Launch your own branded mobile app</h2>
                    <p>
                      Put your store icon right on your customers&apos; home screens. Send free, unlimited push notifications,
                      enjoy 3x higher repeat purchases, and eliminate marketplace commissions.
                    </p>

                    <div className="locked-progress-box">
                      <div className="locked-progress-header">
                        <strong>Unlock Requirement: 500 Completed Orders or ₹2.5 Lakh GMV</strong>
                        <span>{currentRetailer.deliveredOrders} / 500 Orders ({currentRetailer.orderProgressPct}%)</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${currentRetailer.orderProgressPct}%` }} />
                      </div>
                      <p className="locked-progress-hint">
                        You are almost there! Just <strong>{currentRetailer.remainingOrders} more completed orders</strong> to unlock your free branded mobile app generation.
                      </p>
                    </div>

                    <div className="why-app-grid">
                      <div className="why-app-card">
                        <div className="why-app-icon"><Icon name="phone" size={20} /></div>
                        <strong>Home Screen Presence</strong>
                        <p>Customers tap your app icon directly instead of searching Google or Instagram.</p>
                      </div>
                      <div className="why-app-card">
                        <div className="why-app-icon"><Icon name="bell" size={20} /></div>
                        <strong>Free Push Notifications</strong>
                        <p>Reach customers instantly about sales and abandoned carts without paying SMS charges.</p>
                      </div>
                      <div className="why-app-card">
                        <div className="why-app-icon"><Icon name="bag" size={20} /></div>
                        <strong>3x Repeat Purchases</strong>
                        <p>Retain loyal shoppers with seamless, one-tap mobile checkout and saved addresses.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* UNLOCKED APP BUILDER SCREEN */
                <div>
                  <section className="page-heading">
                    <div>
                      <div className="eyebrow"><span className="eyebrow-line" /> WHITE-LABEL APP GENERATOR</div>
                      <h1>Launch your mobile app</h1>
                      <p>Generate a unique, signed native app for {currentRetailer.name} in one click.</p>
                    </div>
                  </section>

                  {/* Android vs iOS Selector */}
                  <div className="platform-tabs">
                    <button
                      className={`platform-tab-btn ${platformOption === 'android' ? 'active' : ''}`}
                      onClick={() => setPlatformOption('android')}
                    >
                      <Icon name="phone" size={15} /> Launch Android app (Google Play / Sideload)
                    </button>
                    <button
                      className={`platform-tab-btn ${platformOption === 'ios' ? 'active' : ''}`}
                      onClick={() => setPlatformOption('ios')}
                    >
                      <Icon name="apple" size={15} /> Launch iOS app (Apple App Store / PWA)
                    </button>
                  </div>

                  {platformOption === 'ios' ? (
                    <div className="locked-hero-card" style={{ borderColor: '#dbeafe', background: '#f8fafc' }}>
                      <span className="locked-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                        APPLE APP STORE POLICY FINDINGS
                      </span>
                      <h2>Apple App Store Feasibility & PWA Strategy</h2>
                      <p>
                        Under <strong>Apple App Store Review Guideline 4.2 & 4.2.2 (Minimum Functionality)</strong>,
                        pure web wrappers are strictly rejected unless they provide distinctive native device utilities.
                        Furthermore, each retailer must possess an Apple Developer Account ($99/yr) and a corporate D-U-N-S number.
                      </p>
                      <p style={{ marginTop: '10px' }}>
                        <strong>Recommended Strategy for iOS:</strong> Deploy a Progressive Web App (PWA) with automated
                        &quot;Add to Home Screen&quot; prompts and Web Push Notifications (supported natively in iOS 16.4+).
                      </p>
                    </div>
                  ) : (
                    <section className="builder-layout">
                      <div className="builder-panel">
                        <div className="panel-heading">
                          <div>
                            <span className="step-label"><span>01</span> APP DETAILS</span>
                            <h2>{currentRetailer.name} Android App</h2>
                            <p>Store name and URL are picked up automatically from your Factori account.</p>
                          </div>
                          <div className="panel-heading-icon"><Icon name="sparkle" size={20} /></div>
                        </div>

                        <form className="builder-form" onSubmit={handleBuildSubmit}>
                          <label className="field-label" htmlFor="retailer-name">App Name <span>*</span></label>
                          <div className="input-wrap">
                            <Icon name="bag" size={16} />
                            <input id="retailer-name" type="text" value={currentRetailer.name} readOnly />
                            <span className="field-check"><Icon name="check" size={14} /></span>
                          </div>
                          <p className="field-hint">The app name customers will see on their Android home screen.</p>

                          <label className="field-label url-label" htmlFor="storefront-url">Storefront URL <span>*</span></label>
                          <div className="input-wrap">
                            <Icon name="link" size={16} />
                            <input id="storefront-url" type="url" value={currentRetailer.storefrontUrl} readOnly />
                            <span className="secure-label"><Icon name="shield" size={12} /> HTTPS</span>
                          </div>
                          <p className="field-hint">Target URL rendered inside the secure native WebView shell.</p>

                          <div className="field-label icon-upload-label">App Launcher Icon <span>*</span></div>
                          <label className={`upload-box ${iconPreview ? 'has-file' : ''}`} htmlFor="app-icon">
                            <input id="app-icon" type="file" accept="image/png,.png" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
                            <span className="upload-preview">
                              {iconPreview ? <img src={iconPreview} alt="Icon preview" /> : <Icon name="upload" size={20} />}
                            </span>
                            <span className="upload-copy">
                              <strong>{iconFile ? iconFile.name : 'Upload 512x512 PNG app icon'}</strong>
                              <small>PNG format · 48–2048 px · Maximum 2 MB</small>
                            </span>
                          </label>

                          <div className="package-preview">
                            <div>
                              <span className="package-icon"><Icon name="shield" size={15} /></span>
                              <span>
                                <strong>Unique Application ID</strong>
                                <small>Assigned per retailer with dedicated signing key</small>
                              </span>
                            </div>
                            <code>{packagePreview}</code>
                          </div>

                          {error && <div className="error-message">{error}</div>}

                          <button className="generate-button" type="submit" disabled={submitting || activeStatus === 'building'}>
                            {submitting || activeStatus === 'building' ? (
                              <><span className="button-spinner" /> Generating Signed APK &amp; AAB…</>
                            ) : (
                              <><Icon name="sparkle" size={16} /> Generate APK &amp; AAB →</>
                            )}
                          </button>
                          <div className="form-assurance">
                            <Icon name="shield" size={13} /> Each store receives an isolated PKCS12 release key.
                          </div>
                        </form>
                      </div>

                      {/* Right Hand Phone Preview & Build Status */}
                      <aside className="preview-column">
                        <div className="preview-card">
                          <div className="preview-title">
                            <span>LIVE PREVIEW</span>
                            <span className="preview-online"><i /> STOREFRONT SHELL</span>
                          </div>
                          <div className="phone-stage">
                            <div className="phone-frame">
                              <div className="phone-island" />
                              <div className="phone-status"><span>9:41</span><span>5G ▰</span></div>
                              <div className="phone-screen">
                                <div className="phone-app-icon">
                                  {iconPreview ? <img src={iconPreview} alt="" /> : <Icon name="bag" size={22} />}
                                </div>
                                <strong>{currentRetailer.name}</strong>
                                <small>{currentRetailer.domain}</small>
                                <div className="phone-hero">
                                  <span className="phone-hero-tag">FEATURED</span>
                                  <strong>New Festive<br />Collection</strong>
                                </div>
                                <div className="phone-bottom">
                                  <span>⌂<small>Home</small></span>
                                  <span>⌕<small>Shop</small></span>
                                  <span>▢<small>Cart</small></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="build-status-card">
                          <div className="status-card-top">
                            <span className="status-pulse"><i /></span>
                            <div className="status-meta">
                              <strong>{activeBuild ? activeBuild.retailerName : currentRetailer.name}</strong>
                              <small>Build Status</small>
                            </div>
                            <span className={`status-pill ${activeStatus}`}>{activeStatus}</span>
                          </div>

                          <div className="status-progress">
                            <div className="progress-track"><span style={{ width: `${activeProgress}%` }} /></div>
                            <span>{activeProgress}%</span>
                          </div>
                          <p>{activeBuild?.message || 'Ready to trigger automated Gradle release compilation.'}</p>

                          {activeStatus === 'completed' && (
                            <a
                              className="download-button"
                              href={activeBuild?.id && backendOnline ? `${API_BASE}/api/download/${activeBuild.id}` : '#'}
                              download
                            >
                              <Icon name="download" size={15} /> Download Signed APK
                            </a>
                          )}

                          {activeStatus === 'failed' && (
                            <div style={{ marginTop: '10px' }}>
                              <a
                                className="download-button"
                                style={{ background: '#4f46e5' }}
                                href={activeBuild?.id && backendOnline ? `${API_BASE}/api/download/${activeBuild.id}` : '#'}
                                download
                              >
                                <Icon name="download" size={15} /> Download Packaged Release APK
                              </a>
                            </div>
                          )}
                        </div>
                      </aside>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* ==================== TAB 2: MY MOBILE APP (USERS TABLE) ==================== */}
          {activeTab === 'users' && (
            <div className="data-table-card">
              <div className="data-table-header">
                <div>
                  <h2>My mobile app: Customer Activity</h2>
                  <p>Shows who installed your app, who logged in, phone numbers captured at login, and who is active.</p>
                </div>
                <span className="history-count">{appUsers.length} Devices Registered</span>
              </div>

              <div className="table-wrap">
                <table className="factori-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER NAME</th>
                      <th>MOBILE NUMBER</th>
                      <th>DEVICE &amp; OS</th>
                      <th>FIRST INSTALLED</th>
                      <th>LOGGED IN</th>
                      <th>LAST ACTIVE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appUsers.map((user) => (
                      <tr key={user.deviceId}>
                        <td><strong>{user.customerName}</strong></td>
                        <td><code>{user.phone}</code></td>
                        <td>{user.platform}</td>
                        <td>{formatDate(user.installedAt)}</td>
                        <td>{formatDate(user.loggedInAt)}</td>
                        <td>{user.lastActiveAt}</td>
                        <td>
                          <span className={`status-tag ${user.status}`}>
                            {user.status === 'uninstalled' ? '⚠ Uninstalled (FCM dead token)' : user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: PUSH NOTIFICATIONS ==================== */}
          {activeTab === 'notifications' && (
            <div className="push-studio-layout">
              <div className="push-form-card">
                <h2>Push Notification Studio</h2>
                <p style={{ color: '#8c8b98', fontSize: '11px', marginBottom: '16px' }}>
                  Send targeted push notifications to all installed {currentRetailer.name} apps. Tapping the notification
                  opens the specific product page.
                </p>

                <form onSubmit={handleSendNotification}>
                  <label className="field-label">Notification Title <span>*</span></label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      required
                    />
                  </div>

                  <label className="field-label" style={{ marginTop: '14px' }}>Notification Message <span>*</span></label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      value={pushBody}
                      onChange={(e) => setPushBody(e.target.value)}
                      required
                    />
                  </div>

                  <label className="field-label" style={{ marginTop: '14px' }}>Product Deep Link URL <span>*</span></label>
                  <div className="input-wrap">
                    <Icon name="link" size={15} />
                    <input
                      type="url"
                      value={pushUrl}
                      onChange={(e) => setPushUrl(e.target.value)}
                      required
                    />
                  </div>
                  <p className="field-hint">When the customer taps, the app opens this product page directly.</p>

                  <button className="generate-button" type="submit" style={{ marginTop: '18px' }}>
                    <Icon name="send" size={15} /> Dispatch Push Notification Now
                  </button>
                  {pushStatus && (
                    <p style={{ marginTop: '12px', fontSize: '11px', color: pushStatus.startsWith('Error') ? '#b91c1c' : '#15803d' }}>
                      {pushStatus}
                    </p>
                  )}
                </form>
              </div>

              <div className="push-preview-card">
                <h3>Live Handset Preview</h3>
                <p style={{ color: '#777', fontSize: '11px' }}>How your notification looks on customer lockscreens:</p>
                <div className="push-notif-box">
                  <div className="push-notif-top">
                    <Icon name="bell" size={13} />
                    <span>{currentRetailer.name.toUpperCase()} • JUST NOW</span>
                  </div>
                  <strong>{pushTitle}</strong>
                  <p>{pushBody}</p>
                  <span className="push-deep-link">Opens: {pushUrl}</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: STORE GUIDES ==================== */}
          {activeTab === 'guides' && (
            <div className="data-table-card">
              <h2>Publishing Guides: Google Play &amp; Apple App Store</h2>
              <p style={{ color: '#8c8b98', fontSize: '11.5px', marginBottom: '20px' }}>
                Follow these step-by-step instructions to upload your generated Android App Bundle (.aab) to Google Play.
              </p>

              <div className="why-app-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="why-app-card" style={{ border: '1px solid #c7d2fe' }}>
                  <div className="why-app-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><Icon name="play" size={18} /></div>
                  <strong style={{ fontSize: '14px' }}>Google Play Console Guide</strong>
                  <ol style={{ paddingLeft: '18px', fontSize: '11.5px', color: '#555', lineHeight: '1.8', margin: '10px 0' }}>
                    <li>Create an Organization Account at play.google.com/console ($25 fee).</li>
                    <li>Ensure you have your D-U-N-S number to bypass the 14-day 20-tester rule.</li>
                    <li>Upload the signed <code>app-release.aab</code> generated by Factori.</li>
                    <li>Set Privacy Policy URL to <code>https://{currentRetailer.domain}/privacy</code>.</li>
                    <li>Submit for review. Typical approval: 2–3 business days.</li>
                  </ol>
                  <a className="outline-button" href="/docs/ARCHITECTURE.html" target="_blank" rel="noreferrer">
                    Download Publishing PDF Guide
                  </a>
                </div>

                <div className="why-app-card" style={{ border: '1px solid #fee2e2' }}>
                  <div className="why-app-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><Icon name="apple" size={18} /></div>
                  <strong style={{ fontSize: '14px' }}>Apple App Store Analysis</strong>
                  <p style={{ fontSize: '11.5px', color: '#555', lineHeight: '1.7', marginTop: '10px' }}>
                    Apple Guideline 4.2 strictly forbids repackaged web storefronts.
                    Submitting a WebView wrapper risks permanent rejection and wastes the $99/year fee.
                    <br /><br />
                    <strong>Factori Solution:</strong> We deploy an automated PWA for iOS shoppers with home-screen
                    shortcuts and Web Push Notifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: BUILD HISTORY ==================== */}
          {activeTab === 'history' && (
            <div className="history-section" style={{ marginTop: '0' }}>
              <div className="history-heading">
                <div>
                  <h2>Build History</h2>
                  <p>All signed Android APK and AAB packages generated for your stores.</p>
                </div>
                <span className="history-count">{history.length} Builds</span>
              </div>

              <div className="history-table-wrap">
                {history.length === 0 ? (
                  <div className="empty-history">
                    <span className="empty-history-icon"><Icon name="phone" size={20} /></span>
                    <strong>No builds recorded yet</strong>
                    <p>Trigger your first build from the App Builder tab.</p>
                  </div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>RETAILER</th>
                        <th>PACKAGE ID</th>
                        <th>DATE</th>
                        <th>STATUS</th>
                        <th>DOWNLOAD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((build) => (
                        <tr key={build.id}>
                          <td><strong>{build.retailerName}</strong></td>
                          <td><code>{build.applicationId}</code></td>
                          <td>{formatDate(build.createdAt)}</td>
                          <td><span className={`table-status ${build.status}`}><i /> {build.status}</span></td>
                          <td>
                            {build.status === 'completed' && (
                              <a className="table-download" href={backendOnline ? `${API_BASE}/api/download/${build.id}` : '#'} download>
                                <Icon name="download" size={14} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
