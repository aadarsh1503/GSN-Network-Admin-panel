#!/bin/bash

# Script to remove test/debug files from git tracking
# Run this script to clean up your repository

echo "🧹 Removing test, debug, and check files from git tracking..."

# Remove files from git index but keep them locally
git rm --cached test_*.js test_*.html test_*.cjs 2>/dev/null || true
git rm --cached debug_*.js debug_*.html debug_*.cjs 2>/dev/null || true
git rm --cached check_*.js check_*.html check_*.cjs check_*.sql 2>/dev/null || true
git rm --cached verify_*.js 2>/dev/null || true
git rm --cached simulate_*.js 2>/dev/null || true
git rm --cached investigate_*.js 2>/dev/null || true
git rm --cached comprehensive_*.js 2>/dev/null || true
git rm --cached direct_*.js 2>/dev/null || true
git rm --cached final_*.js 2>/dev/null || true
git rm --cached force_*.js 2>/dev/null || true
git rm --cached run_*.js 2>/dev/null || true
git rm --cached setup_*.js 2>/dev/null || true
git rm --cached apply_*.js 2>/dev/null || true
git rm --cached create_*.js 2>/dev/null || true
git rm --cached add_*.js 2>/dev/null || true
git rm --cached update_*.js 2>/dev/null || true
git rm --cached remove_*.js 2>/dev/null || true
git rm --cached cleanup_*.js 2>/dev/null || true
git rm --cached fix_*.js 2>/dev/null || true
git rm --cached populate_*.js 2>/dev/null || true
git rm --cached insert_*.js 2>/dev/null || true
git rm --cached analyze_*.js 2>/dev/null || true
git rm --cached monitor_*.js 2>/dev/null || true

# Remove server-specific files
git rm --cached server/test_*.js server/test_*.cjs 2>/dev/null || true
git rm --cached server/debug_*.js server/debug_*.cjs 2>/dev/null || true
git rm --cached server/check_*.js server/check_*.cjs server/check_*.sql 2>/dev/null || true
git rm --cached server/verify_*.js 2>/dev/null || true
git rm --cached server/simulate_*.js 2>/dev/null || true
git rm --cached server/investigate_*.js 2>/dev/null || true
git rm --cached server/comprehensive_*.js 2>/dev/null || true
git rm --cached server/direct_*.js 2>/dev/null || true
git rm --cached server/final_*.js 2>/dev/null || true
git rm --cached server/force_*.js 2>/dev/null || true
git rm --cached server/run_*.js 2>/dev/null || true
git rm --cached server/setup_*.js 2>/dev/null || true
git rm --cached server/apply_*.js 2>/dev/null || true
git rm --cached server/create_*.js 2>/dev/null || true
git rm --cached server/add_*.js 2>/dev/null || true
git rm --cached server/update_*.js 2>/dev/null || true
git rm --cached server/remove_*.js 2>/dev/null || true
git rm --cached server/cleanup_*.js 2>/dev/null || true
git rm --cached server/fix_*.js 2>/dev/null || true
git rm --cached server/populate_*.js 2>/dev/null || true
git rm --cached server/insert_*.js 2>/dev/null || true
git rm --cached server/hashPassword.js 2>/dev/null || true
git rm --cached server/set_admin_password.js 2>/dev/null || true

# Remove SQL files
git rm --cached server/*.sql 2>/dev/null || true
git rm --cached *.sql 2>/dev/null || true

echo "✅ Test files removed from git tracking"
echo "📝 Files are still on your local filesystem but won't be tracked by git"
echo "🔄 Run 'git status' to see the changes"
echo "💾 Run 'git commit -m \"Remove test files from tracking\"' to commit the changes"