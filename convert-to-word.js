#!/usr/bin/env node

/**
 * Convert Markdown to Word Document
 *
 * This script converts markdown files to .docx format using pandoc.
 *
 * Usage:
 *   node convert-to-word.js <input.md> [output.docx]
 *
 * Example:
 *   node convert-to-word.js transcripts/ski-3-concepts-podcast.md
 *   node convert-to-word.js transcripts/ski-3-concepts-podcast.md output/ski-podcast.docx
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Error: No input file specified');
    console.log('Usage: node convert-to-word.js <input.md> [output.docx]');
    console.log('Example: node convert-to-word.js transcripts/ski-3-concepts-podcast.md');
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.md$/, '.docx');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
}

// Check if pandoc is installed
try {
    execSync('pandoc --version', { stdio: 'ignore' });
} catch (error) {
    console.error('Error: pandoc is not installed');
    console.log('\nPlease install pandoc:');
    console.log('  macOS:   brew install pandoc');
    console.log('  Ubuntu:  sudo apt-get install pandoc');
    console.log('  Windows: Download from https://pandoc.org/installing.html');
    process.exit(1);
}

console.log(`Converting: ${inputFile}`);
console.log(`Output to: ${outputFile}`);

// Create output directory if it doesn't exist
const outputDir = path.dirname(outputFile);
if (outputDir !== '.' && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    // Run pandoc conversion
    // Options:
    // -f markdown: from markdown format
    // -t docx: to Word format
    // --reference-doc: optional custom Word template
    // --toc: add table of contents
    // --highlight-style: code syntax highlighting

    const command = `pandoc "${inputFile}" -f markdown -t docx -o "${outputFile}" --highlight-style=tango`;

    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ Conversion successful!');
    console.log(`📄 Output file: ${path.resolve(outputFile)}`);

} catch (error) {
    console.error('\n❌ Conversion failed');
    console.error(error.message);
    process.exit(1);
}
