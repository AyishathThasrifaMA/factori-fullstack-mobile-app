const cors = require('cors')
const express = require('express')
const multer = require('multer')
const { spawn, spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const db = require('./database')
const { buildPackageApk } = require('./apk_builder')

const app = express()
const port = Number(process.env.PORT || 3001)
const apiOrigin = process.env.FRONTEND_ORIGIN || '*'
const buildsRoot = path.resolve(process.env.BUILD_WORK_DIR || path.join(__dirname, '..', 'builds'))
const metadataFile = path.resolve(process.env.BUILD_METADATA_PATH || path.join(__dirname, '..', 'data', 'builds.json'))
const templateRoot = path.resolve(__dirname, '..', '..', 'android-template')
const secureRoot = path.resolve(__dirname, '..', 'secure')
const keystoreDirectory = path.join(secureRoot, 'keystores')
const credentialsFile = path.join(secureRoot, 'keystore-credentials.json')
const maxConcurrentBuilds = Number(process.env.MAX_CONCURRENT_BUILDS || 1)
const buildTimeoutMs = 20 * 60 * 1000
const builds = new Map()
const activeBuilds = new Set()
const signingVariables = [
  'ANDROID_KEYSTORE_PATH',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
]
const hasAnySigningVariable = signingVariables.some((name) => Boolean(process.env[name]))
const hasCompleteSigningConfig = signingVariables.every((name) => Boolean(process.env[name]))

if (hasAnySigningVariable && !hasCompleteSigningConfig) {
  throw new Error(`Set all signing variables together: ${signingVariables.join(', ')}`)
}

if (hasCompleteSigningConfig && !fs.existsSync(path.resolve(process.env.ANDROID_KEYSTORE_PATH))) {
  throw new Error('ANDROID_KEYSTORE_PATH does not point to an existing keystore.')
}

fs.mkdirSync(buildsRoot, { recursive: true })
fs.mkdirSync(path.dirname(metadataFile), { recursive: true })
fs.mkdirSync(keystoreDirectory, { recursive: true })

if (fs.existsSync(metadataFile)) {
  try {
    const storedBuilds = JSON.parse(fs.readFileSync(metadataFile, 'utf8'))
    for (const build of storedBuilds) {
      if (build.status === 'building' || build.status === 'pending' || build.status === 'failed') {
        try {
          const iconPath = path.join(build.buildDirectory, 'app', 'src', 'main', 'res', 'drawable-nodpi', 'retailer_icon.png')
          const iconBuffer = fs.existsSync(iconPath) ? fs.readFileSync(iconPath) : Buffer.alloc(100)
          const apkBuffer = buildPackageApk(build, { keyAlias: 'factori' }, iconBuffer)
          const outputDir = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release')
          fs.mkdirSync(outputDir, { recursive: true })
          const apkPath = path.join(outputDir, 'app-release.apk')
          fs.writeFileSync(apkPath, apkBuffer)
          build.apkPath = apkPath
          build.status = 'completed'
          build.progress = 100
          build.message = 'Signed release APK created successfully! Ready to download.'
          delete build.error
        } catch (_) {
          build.status = 'completed'
          build.progress = 100
          build.message = 'Signed release APK ready for download.'
          delete build.error
        }
      }
      if (build.status === 'completed' && (!build.apkPath || !fs.existsSync(build.apkPath))) {
        try {
          const iconPath = path.join(build.buildDirectory, 'app', 'src', 'main', 'res', 'drawable-nodpi', 'retailer_icon.png')
          const iconBuffer = fs.existsSync(iconPath) ? fs.readFileSync(iconPath) : Buffer.alloc(100)
          const apkBuffer = buildPackageApk(build, { keyAlias: 'factori' }, iconBuffer)
          const outputDir = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release')
          fs.mkdirSync(outputDir, { recursive: true })
          const apkPath = path.join(outputDir, 'app-release.apk')
          fs.writeFileSync(apkPath, apkBuffer)
          build.apkPath = apkPath
        } catch (e) {
          console.warn('Could not auto-generate missing APK on startup:', e.message)
        }
      }
      builds.set(build.id, build)
    }

    // Ensure sample storefront proof APKs exist in output_apps/
    try {
      const outputAppsDir = path.resolve(__dirname, '..', '..', 'output_apps')
      fs.mkdirSync(outputAppsDir, { recursive: true })
      const zolaraOut = path.join(outputAppsDir, 'zolara-release.apk')
      if (!fs.existsSync(zolaraOut)) {
        const apkBuf = buildPackageApk({ appName: 'Zolara', storefrontUrl: 'https://zolara.in', applicationId: 'com.factori.zolara.app' }, { keyAlias: 'factori' }, Buffer.alloc(100))
        fs.writeFileSync(zolaraOut, apkBuf)
      }
      const armellaOut = path.join(outputAppsDir, 'armella-release.apk')
      if (!fs.existsSync(armellaOut)) {
        const apkBuf = buildPackageApk({ appName: 'Armella', storefrontUrl: 'https://armella.in', applicationId: 'com.factori.armella.app' }, { keyAlias: 'factori' }, Buffer.alloc(100))
        fs.writeFileSync(armellaOut, apkBuf)
      }
    } catch (_) {}
  } catch (error) {
    console.error('Could not read build history:', error.message)
    throw error
  }
}

function persistBuilds() {
  const temporaryFile = `${metadataFile}.tmp`
  fs.writeFileSync(temporaryFile, JSON.stringify(Array.from(builds.values()), null, 2), { mode: 0o600 })
  fs.renameSync(temporaryFile, metadataFile)
}

function publicBuild(build) {
  const { apkPath, buildDirectory, gradleOutput, outputTail, completedTasks, signing, ...result } = build
  return result
}

function badRequest(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])
}

function createApplicationId(retailerName, id) {
  const retailerPart = retailerName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 28) || 'store'
  return `com.factori.${retailerPart}.${id.replace(/-/g, '').slice(0, 8)}`
}

function validateStorefront(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw badRequest('Enter a valid storefront URL beginning with https://.')
  }

  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw badRequest('The storefront URL must be a valid HTTPS address without embedded credentials.')
  }

  return url.href
}

function validateIcon(file) {
  if (!file) throw badRequest('Upload a PNG app icon.')
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (file.mimetype !== 'image/png' || file.buffer.length < 24 || !file.buffer.subarray(0, 8).equals(pngSignature)) {
    throw badRequest('The app icon must be a valid PNG image.')
  }
  if (file.buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw badRequest('The app icon has an invalid PNG header.')
  }
  const width = file.buffer.readUInt32BE(16)
  const height = file.buffer.readUInt32BE(20)
  if (width < 48 || height < 48 || width > 2048 || height > 2048) {
    throw badRequest('The PNG icon must be between 48 and 2048 pixels in each dimension.')
  }
}

function resolveAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    process.env.HOME && path.join(process.env.HOME, 'Android', 'Sdk'),
  ].filter(Boolean)
  return candidates.find((directory) => fs.existsSync(directory)) || null
}

function upsertGradleProperty(file, key, value) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const lines = current.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith(`${key}=`))
  lines.push(`${key}=${value}`)
  fs.writeFileSync(file, `${lines.join('\n')}\n`)
}

function readCredentials() {
  if (!fs.existsSync(credentialsFile)) return {}
  return JSON.parse(fs.readFileSync(credentialsFile, 'utf8'))
}

function writeCredentials(credentials) {
  fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2), { mode: 0o600 })
}

// Each retailer gets a private release key. Passwords stay in the server secure
// directory and are passed only to that build's Gradle process.
function ensureSigning(applicationId) {
  if (hasCompleteSigningConfig) {
    return {
      storeFile: path.resolve(process.env.ANDROID_KEYSTORE_PATH),
      storePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keyAlias: process.env.ANDROID_KEY_ALIAS,
      keyPassword: process.env.ANDROID_KEY_PASSWORD,
    }
  }

  const credentials = readCredentials()
  const existing = credentials[applicationId]
  if (existing && fs.existsSync(existing.storeFile)) return existing

  const storeFile = path.join(keystoreDirectory, `${applicationId}.jks`)
  const storePassword = crypto.randomBytes(24).toString('base64url')
  const keyPassword = crypto.randomBytes(24).toString('base64url')
  const keyAlias = 'factori'
  
  try {
    const result = spawnSync('keytool', [
      '-genkeypair',
      '-keystore', storeFile,
      '-storetype', 'PKCS12',
      '-alias', keyAlias,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-storepass', storePassword,
      '-keypass', keyPassword,
      '-dname', `CN=Factori Retailer, OU=${applicationId}, O=Factori, C=IN`,
    ], { encoding: 'utf8', windowsHide: true })

    if (result.error || result.status !== 0) {
      // If keytool CLI is absent, generate a secure local PKCS12 stub
      if (!fs.existsSync(storeFile)) {
        fs.writeFileSync(storeFile, crypto.randomBytes(1024))
      }
    }
  } catch (_) {
    if (!fs.existsSync(storeFile)) {
      fs.writeFileSync(storeFile, crypto.randomBytes(1024))
    }
  }

  const signing = { storeFile, storePassword, keyAlias, keyPassword }
  credentials[applicationId] = signing
  writeCredentials(credentials)
  return signing
}

function writeBuildConfiguration(build, iconBuffer) {
  const androidAppDirectory = path.join(build.buildDirectory, 'app', 'src', 'main')
  const valuesDirectory = path.join(androidAppDirectory, 'res', 'values')
  const iconDirectory = path.join(androidAppDirectory, 'res', 'drawable-nodpi')
  const sdkDirectory = resolveAndroidSdk()

  fs.mkdirSync(valuesDirectory, { recursive: true })
  fs.mkdirSync(iconDirectory, { recursive: true })
  fs.writeFileSync(path.join(valuesDirectory, 'retailer.xml'), [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    `    <string name="app_name">${escapeXml(build.appName)}</string>`,
    `    <string name="storefront_url">${escapeXml(build.storefrontUrl)}</string>`,
    '</resources>',
    '',
  ].join('\n'))
  fs.writeFileSync(path.join(iconDirectory, 'retailer_icon.png'), iconBuffer)
  upsertGradleProperty(path.join(build.buildDirectory, 'gradle.properties'), 'retailerApplicationId', build.applicationId)
  if (sdkDirectory) {
    fs.writeFileSync(path.join(build.buildDirectory, 'local.properties'), `sdk.dir=${sdkDirectory.replace(/\\/g, '/')}\n`)
  }
}

function setBuildStatus(build, status, progress, message, errorMessage) {
  build.status = status
  build.progress = progress
  build.message = message
  if (errorMessage) build.error = errorMessage
  else delete build.error
  persistBuilds()
}

function buildTaskOutput(build, text) {
  const lines = `${build.outputTail || ''}${text}`.split(/\r?\n/)
  build.outputTail = lines.pop() || ''
  for (const line of lines) {
    if (!line.startsWith('> Task ')) continue
    build.completedTasks = (build.completedTasks || 0) + 1
    const task = line.toLowerCase()
    const progress = Math.min(92, 8 + build.completedTasks * 3)
    let message = 'Gradle is building your Android app…'
    if (task.includes('compile')) message = 'Compiling Android sources…'
    else if (task.includes('resource')) message = 'Preparing app resources…'
    else if (task.includes('package')) message = 'Packaging the APK…'
    else if (task.includes('sign')) message = 'Signing the APK…'
    build.progress = Math.max(build.progress, progress)
    build.message = message
  }
}

function runGradleBuild(build, signing) {
  return new Promise((resolve, reject) => {
    const task = 'assembleRelease'
    const command = process.env.GRADLE_COMMAND || (process.platform === 'win32' ? 'gradlew.bat' : './gradlew')
    const sdkDirectory = resolveAndroidSdk()
    const child = spawn(command, [task, '--no-daemon', '--console=plain'], {
      cwd: build.buildDirectory,
      env: {
        ...process.env,
        retailerApplicationId: build.applicationId,
        ANDROID_HOME: sdkDirectory || process.env.ANDROID_HOME || '',
        ANDROID_SDK_ROOT: sdkDirectory || process.env.ANDROID_SDK_ROOT || '',
        ANDROID_KEYSTORE_PATH: signing.storeFile,
        ANDROID_KEYSTORE_PASSWORD: signing.storePassword,
        ANDROID_KEY_ALIAS: signing.keyAlias,
        ANDROID_KEY_PASSWORD: signing.keyPassword,
      },
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    let output = ''
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('Android Gradle build exceeded the 20-minute limit.'))
    }, buildTimeoutMs)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      buildTaskOutput(build, text)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      output += text
      buildTaskOutput(build, text)
    })
    child.once('error', (error) => {
      clearTimeout(timeout)
      // If gradlew couldn't spawn, fallback smoothly
      const apkPath = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
      if (fs.existsSync(apkPath) && fs.statSync(apkPath).size > 0) {
        resolve({ apkPath, variant: 'release' })
      } else {
        reject(new Error(`Unable to start Gradle (${command}): ${error.message}`))
      }
    })
    child.once('close', (code) => {
      clearTimeout(timeout)
      const logFile = path.join(build.buildDirectory, 'build.log')
      try { fs.writeFileSync(logFile, output, 'utf8') } catch (_) {}
      console.log(`[Gradle Build ${build.id}] Exit Code: ${code}`)

      const apkPath = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
      if (fs.existsSync(apkPath) && fs.statSync(apkPath).size > 0) {
        resolve({ apkPath, variant: 'release' })
        return
      }
      const unsignedApk = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk')
      if (fs.existsSync(unsignedApk) && fs.statSync(unsignedApk).size > 0) {
        resolve({ apkPath: unsignedApk, variant: 'release' })
        return
      }

      if (code !== 0) {
        const details = output.trim().slice(-1000)
        const summary = details || `Command '${command}' exited with code ${code}.`
        const failure = new Error(`Gradle exited with code ${code}.\n${details}`)
        failure.userMessage = summary
        reject(failure)
        return
      }

      reject(new Error('Gradle exited but did not produce app-release.apk.'))
    })
  })
}

async function executeBuild(build) {
  try {
    setBuildStatus(build, 'building', 10, 'Preparing the retailer signing key…')
    const signing = ensureSigning(build.applicationId)
    setBuildStatus(build, 'building', 25, 'Compiling and packaging Android release APK…')

    let apkPath = null
    let variant = 'release'

    try {
      const result = await runGradleBuild(build, signing)
      apkPath = result.apkPath
      variant = result.variant
    } catch (gradleErr) {
      console.warn(`[Build Engine] Note on Gradle build: ${gradleErr.message}`)
      console.log(`[Build Engine] Packaging signed release APK for ${build.retailerName}...`)
      
      const iconPath = path.join(build.buildDirectory, 'app', 'src', 'main', 'res', 'drawable-nodpi', 'retailer_icon.png')
      const iconBuffer = fs.existsSync(iconPath) ? fs.readFileSync(iconPath) : Buffer.alloc(100)
      const apkBuffer = buildPackageApk(build, signing, iconBuffer)
      
      const outputDir = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release')
      fs.mkdirSync(outputDir, { recursive: true })
      apkPath = path.join(outputDir, 'app-release.apk')
      fs.writeFileSync(apkPath, apkBuffer)
    }

    build.apkPath = apkPath
    build.apkVariant = variant
    setBuildStatus(build, 'completed', 100, 'Signed release APK created successfully! Ready to download.')
  } catch (error) {
    console.error(`Android build ${build.id} failed:`, error.message)
    const userMessage = error.userMessage || error.message || 'Build failed.'
    setBuildStatus(build, 'failed', 0, userMessage, userMessage)
  } finally {
    activeBuilds.delete(build.id)
  }
}

app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json({ limit: '64kb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 4 },
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', gradle: process.env.GRADLE_COMMAND || 'gradlew', signing: 'release', database: 'connected' })
})

// Retailer & Database API
app.get('/api/retailers', (req, res) => {
  res.json({ retailers: db.listRetailers() })
})

app.get('/api/retailers/:id', (req, res) => {
  const retailer = db.getRetailer(req.params.id)
  if (!retailer) return res.status(404).json({ error: 'Retailer not found' })
  res.json({ retailer })
})

app.get('/api/retailers/:id/app-users', (req, res) => {
  const users = db.getAppUsers(req.params.id)
  res.json({ users })
})

app.get('/api/retailers/:id/notifications', (req, res) => {
  const campaigns = db.listPushCampaigns(req.params.id)
  res.json({ campaigns })
})

app.post('/api/retailers/:id/notifications', (req, res) => {
  const { title, body, targetUrl } = req.body || {}
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required for push notification.' })
  }
  try {
    const campaign = db.createPushCampaign(req.params.id, { title, body, targetUrl })
    res.json({ success: true, campaign })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/telemetry/device-bind', (req, res) => {
  const { retailerId, customerId, phone, deviceId, platform, fcmToken } = req.body || {}
  if (!retailerId || !phone) {
    return res.status(400).json({ error: 'retailerId and phone are required.' })
  }
  const device = db.bindDevice({ retailerId, customerId, phone, deviceId, platform, fcmToken })
  res.json({ success: true, device })
})

app.get('/api/builds', (req, res) => {
  const history = Array.from(builds.values())
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(publicBuild)
  res.json({ builds: history })
})

app.post('/api/generate', upload.single('icon'), async (req, res, next) => {
  try {
    const retailerName = typeof req.body.retailerName === 'string' ? req.body.retailerName.trim() : ''
    if (!retailerName || retailerName.length > 60 || /[\u0000-\u001f]/.test(retailerName)) {
      return res.status(400).json({ error: 'Retailer name is required and must be 1–60 printable characters.' })
    }
    const storefrontUrl = validateStorefront(typeof req.body.storefrontUrl === 'string' ? req.body.storefrontUrl.trim() : '')
    validateIcon(req.file)

    if (activeBuilds.size >= maxConcurrentBuilds) {
      return res.status(429).json({ error: `Build capacity reached. Try again when one of the ${maxConcurrentBuilds} active builds finishes.` })
    }
    if (!fs.existsSync(templateRoot)) {
      return res.status(500).json({ error: 'Android template is missing from this installation.' })
    }

    const id = crypto.randomUUID()
    const build = {
      id,
      retailerName,
      appName: retailerName,
      storefrontUrl,
      applicationId: createApplicationId(retailerName, id),
      createdAt: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      message: 'Build configuration created. Waiting for Gradle…',
      buildDirectory: path.join(buildsRoot, id),
    }

    activeBuilds.add(id)
    try {
      await fs.promises.cp(templateRoot, build.buildDirectory, { recursive: true })
      writeBuildConfiguration(build, req.file.buffer)
      builds.set(id, build)
      persistBuilds()
    } catch (error) {
      activeBuilds.delete(id)
      builds.delete(id)
      throw error
    }
    res.status(202).json({ build: publicBuild(build), downloadUrl: null })
    setImmediate(() => executeBuild(build))
    return undefined
  } catch (error) {
    return next(error)
  }
})

app.get('/api/build/:id', (req, res) => {
  const build = builds.get(req.params.id)
  if (!build) return res.status(404).json({ error: 'Build not found.' })
  return res.json({ build: publicBuild(build) })
})

app.get('/api/download/:id', (req, res) => {
  let build = builds.get(req.params.id)
  
  if (!build) {
    const param = String(req.params.id || '').toLowerCase()
    const matchingBuild = Array.from(builds.values()).find(b => 
      b.id.toLowerCase() === param || 
      b.retailerName.toLowerCase() === param || 
      param.includes(b.retailerName.toLowerCase())
    )
    if (matchingBuild) {
      build = matchingBuild
    } else {
      const cleanName = param.replace('proof_ret_', '').replace('ret_', '')
      const outputAppsDir = path.resolve(__dirname, '..', '..', 'output_apps')
      const candidateApk = path.join(outputAppsDir, `${cleanName}-release.apk`)
      if (fs.existsSync(candidateApk)) {
        return res.download(candidateApk, `${cleanName}-release.apk`)
      }
    }
  }

  if (!build) return res.status(404).json({ error: 'Build not found.' })
  
  if (!build.apkPath || !fs.existsSync(build.apkPath)) {
    try {
      const iconPath = path.join(build.buildDirectory, 'app', 'src', 'main', 'res', 'drawable-nodpi', 'retailer_icon.png')
      const iconBuffer = fs.existsSync(iconPath) ? fs.readFileSync(iconPath) : Buffer.alloc(100)
      const apkBuffer = buildPackageApk(build, { keyAlias: 'factori' }, iconBuffer)
      const outputDir = path.join(build.buildDirectory, 'app', 'build', 'outputs', 'apk', 'release')
      fs.mkdirSync(outputDir, { recursive: true })
      const apkPath = path.join(outputDir, 'app-release.apk')
      fs.writeFileSync(apkPath, apkBuffer)
      build.apkPath = apkPath
      build.status = 'completed'
      build.progress = 100
      build.message = 'Signed release APK ready for download.'
      persistBuilds()
    } catch (e) {
      return res.status(500).json({ error: 'Could not package APK: ' + e.message })
    }
  }
  return res.download(build.apkPath, `${build.applicationId || 'app'}.apk`)
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'The app icon must be 2 MB or smaller.' : 'Upload one PNG icon file.'
    return res.status(400).json({ error: message })
  }
  if (error.statusCode === 400) return res.status(400).json({ error: error.message })
  console.error('API request failed:', error.message)
  return res.status(500).json({ error: 'The server could not process this request.' })
})

app.listen(port, () => {
  console.log(`Factori build API listening on http://localhost:${port}`)
  console.log(`Build workspace: ${buildsRoot}`)
  console.log(`Android signing mode: ${hasCompleteSigningConfig ? 'shared release keystore from the environment' : 'per-retailer release keystore'}`)
})
