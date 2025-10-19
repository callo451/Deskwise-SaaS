#!/usr/bin/env ts-node

/**
 * KB Categories Migration Verification Script
 *
 * Verifies migration was successful
 *
 * Usage:
 *   npx ts-node scripts/verify-kb-migration.ts
 *
 * Environment variables:
 *   MONGODB_URI - MongoDB connection string
 */

import { MongoClient, ObjectId } from 'mongodb'

async function verify() {
  console.log('========================================')
  console.log('KB Categories Migration Verification')
  console.log('========================================\n')

  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable not set')
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('deskwise')

    let allPassed = true

    // Check 1: All articles have categoryId
    console.log('Check 1: All articles have categoryId...')
    const articlesWithoutCategoryId = await db.collection('kb_articles').countDocuments({
      isActive: true,
      categoryId: { $exists: false }
    })
    if (articlesWithoutCategoryId === 0) {
      console.log('  ✓ All articles have categoryId field\n')
    } else {
      console.log(`  ❌ ${articlesWithoutCategoryId} articles missing categoryId\n`)
      allPassed = false
    }

    // Check 2: All categoryId references are valid
    console.log('Check 2: All categoryId references are valid...')
    const articles = await db.collection('kb_articles').find({
      isActive: true,
      categoryId: { $exists: true }
    }).toArray()

    let invalidRefs = 0
    for (const article of articles) {
      const categoryExists = await db.collection('kb_categories').findOne({
        _id: new ObjectId(article.categoryId),
        orgId: article.orgId
      })
      if (!categoryExists) {
        console.warn(`  ⚠ Article "${article.title}" has invalid categoryId: ${article.categoryId}`)
        invalidRefs++
      }
    }

    if (invalidRefs === 0) {
      console.log('  ✓ All categoryId references are valid\n')
    } else {
      console.log(`  ❌ ${invalidRefs} articles have invalid categoryId references\n`)
      allPassed = false
    }

    // Check 3: All categories have correct fullPath
    console.log('Check 3: All categories have fullPath...')
    const categoriesWithoutPath = await db.collection('kb_categories').countDocuments({
      isActive: true,
      $or: [
        { fullPath: { $exists: false } },
        { fullPath: '' }
      ]
    })
    if (categoriesWithoutPath === 0) {
      console.log('  ✓ All categories have fullPath\n')
    } else {
      console.log(`  ❌ ${categoriesWithoutPath} categories missing fullPath\n`)
      allPassed = false
    }

    // Check 4: No orphaned categories
    console.log('Check 4: No orphaned categories...')
    const categories = await db.collection('kb_categories').find({
      isActive: true,
      parentId: { $exists: true, $ne: null }
    }).toArray()

    let orphaned = 0
    for (const category of categories) {
      const parentExists = await db.collection('kb_categories').findOne({
        _id: new ObjectId(category.parentId),
        orgId: category.orgId
      })
      if (!parentExists) {
        console.warn(`  ⚠ Category "${category.name}" has invalid parentId: ${category.parentId}`)
        orphaned++
      }
    }

    if (orphaned === 0) {
      console.log('  ✓ No orphaned categories\n')
    } else {
      console.log(`  ❌ ${orphaned} categories have invalid parentId\n`)
      allPassed = false
    }

    // Check 5: Indexes exist
    console.log('Check 5: Required indexes exist...')
    const indexes = await db.collection('kb_categories').indexes()
    const requiredIndexes = [
      'orgId_1_slug_1',
      'orgId_1_parentId_1_order_1',
      'orgId_1_isActive_1'
    ]

    const existingIndexNames = indexes.map(idx => idx.name)
    const missingIndexes = requiredIndexes.filter(name => !existingIndexNames.includes(name))

    if (missingIndexes.length === 0) {
      console.log('  ✓ All required indexes exist\n')
    } else {
      console.log(`  ⚠ Missing indexes: ${missingIndexes.join(', ')}\n`)
      // Not critical, so don't fail
    }

    // Statistics
    console.log('========================================')
    console.log('Statistics')
    console.log('========================================')
    const totalCategories = await db.collection('kb_categories').countDocuments({ isActive: true })
    const totalArticles = await db.collection('kb_articles').countDocuments({ isActive: true })
    const articlesWithCategoryId = totalArticles - articlesWithoutCategoryId

    console.log(`Total categories: ${totalCategories}`)
    console.log(`Total articles: ${totalArticles}`)
    console.log(`Articles with categoryId: ${articlesWithCategoryId} (${((articlesWithCategoryId / (totalArticles || 1)) * 100).toFixed(1)}%)`)
    console.log(`Articles without categoryId: ${articlesWithoutCategoryId} (${((articlesWithoutCategoryId / (totalArticles || 1)) * 100).toFixed(1)}%)`)
    console.log(`Invalid categoryId references: ${invalidRefs}`)
    console.log(`Orphaned categories: ${orphaned}`)

    // Category breakdown by org
    console.log('\nCategories by Organization:')
    const categoryByOrg = await db.collection('kb_categories').aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$orgId',
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    for (const org of categoryByOrg) {
      console.log(`  ${org._id}: ${org.count} categories`)
    }

    console.log('\n========================================')
    if (allPassed) {
      console.log('✅ Migration verification passed')
      process.exit(0)
    } else {
      console.log('❌ Migration verification failed - please review errors above')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Verification error:', error)
    throw error
  } finally {
    await client.close()
  }
}

verify().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
