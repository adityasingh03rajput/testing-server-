#!/usr/bin/env node

/**
 * Automatic Merge Conflict Resolver
 * 
 * This script automatically resolves Git merge conflicts by choosing the "origin/main" version
 * for all conflicts, which represents the latest working version.
 */

const fs = require('fs');
const path = require('path');

function fixMergeConflicts(filePath) {
    try {
        console.log(`🔧 Fixing merge conflicts in: ${filePath}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        let hasConflicts = false;
        
        // Pattern to match merge conflict markers (more flexible)
        const conflictPattern = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> origin\/main/g;
        
        // Also handle orphaned markers
        content = content.replace(/<<<<<<< HEAD\r?\n/g, '');
        content = content.replace(/=======\r?\n/g, '');
        content = content.replace(/>>>>>>> origin\/main\r?\n/g, '');
        
        // Replace conflicts with the origin/main version (second part)
        content = content.replace(conflictPattern, (match, headVersion, originVersion) => {
            hasConflicts = true;
            console.log(`   ✅ Resolved conflict - using origin/main version`);
            return originVersion;
        });
        
        if (hasConflicts) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   💾 Saved fixed file: ${filePath}`);
            return true;
        } else {
            console.log(`   ℹ️  No conflicts found in: ${filePath}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

function findFilesWithConflicts(dir = '.') {
    const conflictFiles = [];
    
    function scanDirectory(currentDir) {
        try {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip node_modules, .git, android/build, etc.
                    if (!['node_modules', '.git', 'build', '.gradle', 'uploads'].includes(item)) {
                        scanDirectory(fullPath);
                    }
                } else if (stat.isFile()) {
                    // Check text files for conflicts
                    const ext = path.extname(item).toLowerCase();
                    if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.bat', '.sh'].includes(ext)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            if (content.includes('<<<<<<< HEAD') || content.includes('>>>>>>> origin/main')) {
                                conflictFiles.push(fullPath);
                            }
                        } catch (readError) {
                            // Skip files that can't be read as text
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Could not scan directory ${currentDir}:`, error.message);
        }
    }
    
    scanDirectory(dir);
    return conflictFiles;
}

function main() {
    console.log('🔍 Scanning for merge conflicts...');
    
    const conflictFiles = findFilesWithConflicts();
    
    if (conflictFiles.length === 0) {
        console.log('✅ No merge conflicts found!');
        return;
    }
    
    console.log(`📋 Found ${conflictFiles.length} files with merge conflicts:`);
    conflictFiles.forEach(file => console.log(`   - ${file}`));
    
    console.log('\n🔧 Fixing merge conflicts...');
    
    let fixedCount = 0;
    for (const file of conflictFiles) {
        if (fixMergeConflicts(file)) {
            fixedCount++;
        }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} files with merge conflicts!`);
    
    if (fixedCount > 0) {
        console.log('\n💡 All conflicts resolved using origin/main version (latest working code)');
        console.log('🚀 You can now build the APK successfully!');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixMergeConflicts, findFilesWithConflicts };