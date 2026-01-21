# Markdown to Word Conversion

This guide explains how to convert markdown files to Word documents (.docx).

## Prerequisites

Install **pandoc** (required for conversion):

```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
# Download from https://pandoc.org/installing.html
```

## Usage Options

### Option 1: Using npm script (Recommended)

```bash
npm run convert
```

This will convert `transcripts/ski-3-concepts-podcast.md` to `transcripts/ski-3-concepts-podcast.docx`.

### Option 2: Using Node.js script

```bash
# Convert with auto-generated output filename
node convert-to-word.js transcripts/ski-3-concepts-podcast.md

# Convert with custom output filename
node convert-to-word.js transcripts/ski-3-concepts-podcast.md output/my-podcast.docx
```

### Option 3: Using bash script

```bash
# Convert with auto-generated output filename
./convert-to-word.sh transcripts/ski-3-concepts-podcast.md

# Convert with custom output filename
./convert-to-word.sh transcripts/ski-3-concepts-podcast.md output/my-podcast.docx
```

### Option 4: Direct pandoc command

```bash
pandoc transcripts/ski-3-concepts-podcast.md -f markdown -t docx -o output.docx
```

## Advanced Options

### With Table of Contents

```bash
pandoc transcripts/ski-3-concepts-podcast.md \
  -f markdown \
  -t docx \
  -o output.docx \
  --toc \
  --toc-depth=2
```

### With Custom Word Template

```bash
pandoc transcripts/ski-3-concepts-podcast.md \
  -f markdown \
  -t docx \
  -o output.docx \
  --reference-doc=custom-template.docx
```

### With Syntax Highlighting

```bash
pandoc transcripts/ski-3-concepts-podcast.md \
  -f markdown \
  -t docx \
  -o output.docx \
  --highlight-style=tango
```

Available styles: pygments, tango, espresso, zenburn, kate, monochrome, breezedark, haddock

## Output

The generated Word document will:
- ✅ Preserve markdown formatting (headers, bold, italic, etc.)
- ✅ Convert markdown headers to Word heading styles
- ✅ Maintain paragraph structure
- ✅ Keep line breaks and spacing
- ✅ Support code blocks (if any)

## Troubleshooting

### Error: pandoc is not installed

Install pandoc using the commands in the Prerequisites section above.

### Error: Input file not found

Make sure the path to your markdown file is correct. Use relative paths from the project root.

### Error: Permission denied (bash script)

Make the script executable:
```bash
chmod +x convert-to-word.sh
```

## File Locations

- **Input**: `transcripts/ski-3-concepts-podcast.md`
- **Default output**: `transcripts/ski-3-concepts-podcast.docx`
- **Scripts**:
  - `convert-to-word.js` (Node.js version)
  - `convert-to-word.sh` (Bash version)

## Git Version Control

The generated `.docx` files are binary and not ideal for git. Consider:

1. **Markdown as source of truth** - Keep `.md` files in git, generate `.docx` as needed
2. **Add to .gitignore** - If you don't want to track Word files:
   ```
   *.docx
   ```
3. **Use markdown for collaboration** - Edit and review in markdown, export to Word for final delivery

## Examples

```bash
# Convert the ski podcast
npm run convert

# Convert with custom output location
node convert-to-word.js transcripts/ski-3-concepts-podcast.md docs/ski-tutorial.docx

# Convert multiple files
for file in transcripts/*.md; do
  pandoc "$file" -f markdown -t docx -o "${file%.md}.docx"
done
```
