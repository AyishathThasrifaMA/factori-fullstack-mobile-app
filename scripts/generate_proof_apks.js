const fs = require('node:fs')
const path = require('node:path')
const { createBrandedIcon } = require('../generator/png_helper')
const { buildPackageApk } = require('../backend/src/apk_builder')

const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'output_apps')
const assetsDir = path.join(rootDir, 'generator', 'assets')

fs.mkdirSync(outputDir, { recursive: true })
fs.mkdirSync(assetsDir, { recursive: true })

// 1. Generate Zolara App
const zolaraIcon = createBrandedIcon(256, 256, { r: 13, g: 148, b: 136 })
const zolaraIconPath = path.join(assetsDir, 'zolara_icon.png')
fs.writeFileSync(zolaraIconPath, zolaraIcon)

const zolaraApk = buildPackageApk(
  {
    appName: 'Zolara',
    storefrontUrl: 'https://zolara.in',
    applicationId: 'com.factori.zolara.app',
  },
  { keyAlias: 'factori' },
  zolaraIcon
)
const zolaraApkPath = path.join(outputDir, 'zolara-release.apk')
fs.writeFileSync(zolaraApkPath, zolaraApk)
console.log(`[Generated Proof] ${zolaraApkPath} (${(zolaraApk.length / 1024).toFixed(1)} KB)`)

// 2. Generate Armella App
const armellaIcon = createBrandedIcon(256, 256, { r: 225, g: 29, b: 72 })
const armellaIconPath = path.join(assetsDir, 'armella_icon.png')
fs.writeFileSync(armellaIconPath, armellaIcon)

const armellaApk = buildPackageApk(
  {
    appName: 'Armella',
    storefrontUrl: 'https://armella.in',
    applicationId: 'com.factori.armella.app',
  },
  { keyAlias: 'factori' },
  armellaIcon
)
const armellaApkPath = path.join(outputDir, 'armella-release.apk')
fs.writeFileSync(armellaApkPath, armellaApk)
console.log(`[Generated Proof] ${armellaApkPath} (${(armellaApk.length / 1024).toFixed(1)} KB)`)

