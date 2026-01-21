#!/bin/bash

# Convert Markdown to Word Document using Pandoc
#
# Usage:
#   ./convert-to-word.sh <input.md> [output.docx]
#
# Example:
#   ./convert-to-word.sh transcripts/ski-3-concepts-podcast.md

# Check if input file is provided
if [ -z "$1" ]; then
    echo "Error: No input file specified"
    echo "Usage: ./convert-to-word.sh <input.md> [output.docx]"
    echo "Example: ./convert-to-word.sh transcripts/ski-3-concepts-podcast.md"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.md}.docx}"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Error: pandoc is not installed"
    echo ""
    echo "Please install pandoc:"
    echo "  macOS:   brew install pandoc"
    echo "  Ubuntu:  sudo apt-get install pandoc"
    echo "  Windows: Download from https://pandoc.org/installing.html"
    exit 1
fi

echo "Converting: $INPUT_FILE"
echo "Output to: $OUTPUT_FILE"

# Create output directory if needed
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
if [ "$OUTPUT_DIR" != "." ] && [ ! -d "$OUTPUT_DIR" ]; then
    mkdir -p "$OUTPUT_DIR"
fi

# Run pandoc conversion
pandoc "$INPUT_FILE" -f markdown -t docx -o "$OUTPUT_FILE" --highlight-style=tango

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Conversion successful!"
    echo "📄 Output file: $(pwd)/$OUTPUT_FILE"
else
    echo ""
    echo "❌ Conversion failed"
    exit 1
fi
