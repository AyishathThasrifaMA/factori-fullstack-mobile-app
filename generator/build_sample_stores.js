#!/usr/bin/env node

/**
 * Factori Sample Stores Automated Builder
 * 
 * Satisfies Assignment Requirement Section 5.2:
 * "A generator that takes a store name, a storefront URL and an icon as input
 *  and returns an installable Android app, with nothing done by hand in between.
 *  Run it for two different live factori storefronts. Each app must carry its
 *  own name and icon and open its own store."
 * 
 * Target Stores:
 * 1. Zolara (https://zolara.in)
 * 2. Armella (https://armella.in)
 */

const fs = require('node:fs')
const path = require('node:path')
const { createBrandedIcon } = require('./png_helper')
const { runDirectBuild } = require('./generate_app')

async function run() {
  console.log(`================================================================`)
  console.log(` FACTORI AUTOMATED APPS GENERATOR - DUAL STORE PROOF RUNNER     `)
  console.log(`================================================================`)

  const assetsDir = path.resolve(__dirname, 'assets')
  const outputDir = path.resolve(__dirname, '..', 'output_apps')
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.mkdirSync(outputDir, { recursive: true })

  // 1. Prepare Brand Icon for Store 1: Zolara (Emerald / Teal Luxe)
  const zolaraIconPath = path.join(assetsDir, 'zolara_icon.png')
  if (!fs.existsSync(zolaraIconPath)) {
    console.log(`Generating high-res PNG icon for Zolara...`)
    fs.writeFileSync(zolaraIconPath, createBrandedIcon(256, 256, { r: 13, g: 148, b: 136 }))
  }

  // 2. Prepare Brand Icon for Store 2: Armella (Rose / Crimson Elegance)
  const armellaIconPath = path.join(assetsDir, 'armella_icon.png')
  if (!fs.existsSync(armellaIconPath)) {
    console.log(`Generating high-res PNG icon for Armella...`)
    fs.writeFileSync(armellaIconPath, createBrandedIcon(256, 256, { r: 225, g: 29, b: 72 }))
  }

  const stores = [
    {
      name: 'Zolara',
      url: 'https://zolara.in',
      icon: zolaraIconPath,
    },
    {
      name: 'Armella',
      url: 'https://armella.in',
      icon: armellaIconPath,
    },
  ]

  const results = []

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    console.log(`\n>>> Executing Build [${i + 1}/${stores.length}] for Storefront: ${store.name}`)
    try {
      const result = await runDirectBuild({
        name: store.name,
        url: store.url,
        icon: store.icon,
        out: outputDir,
      })
      results.push({ ...store, ...result, status: 'SUCCESS' })
    } catch (err) {
      console.error(`Build failed for ${store.name}:`, err.message)
      results.push({ ...store, error: err.message, status: 'FAILED' })
    }
  }

  console.log(`\n================================================================`)
  console.log(` SUMMARY OF PROOF GENERATION FOR TWO LIVE FACTORI STORES        `)
  console.log(`================================================================`)
  for (const r of results) {
    console.log(`Store:       ${r.name}`)
    console.log(`URL:         ${r.url}`)
    console.log(`Status:      ${r.status}`)
    if (r.finalApkPath) console.log(`APK Output:  ${r.finalApkPath}`)
    if (r.error) console.log(`Error:       ${r.error}`)
    console.log(`----------------------------------------------------------------`)
  }
}

if (require.main === module) {
  run()
}

