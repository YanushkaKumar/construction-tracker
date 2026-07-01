#!/bin/bash

# This script converts all .mmd files in the current directory to PNG images.
# It uses the official Mermaid CLI via npx, so it doesn't require global installation.

echo "Creating Puppeteer config to bypass Linux sandbox restrictions..."
echo '{"args": ["--no-sandbox"]}' > puppeteer-config.json

echo "Installing mermaid-cli temporarily and converting diagrams..."

# Loop through all .mmd files in the directory
for file in *.mmd; do
    # Extract filename without extension
    filename="${file%.*}"
    
    echo "Converting $file to ${filename}.png..."
    
    # Run the mermaid CLI tool with the sandbox bypassed
    npx -p @mermaid-js/mermaid-cli mmdc -i "$file" -o "${filename}.png" -b white -p puppeteer-config.json
done

# Cleanup the temp config
rm puppeteer-config.json

echo "✅ All diagrams have been successfully converted!"
