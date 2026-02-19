
const fs = require('fs');
const path = require('path');

const files = [
    'src/data/verses/romans.ts',
    'src/data/verses/healing.ts',
    'src/data/verses/gospel.ts',
    'src/data/verses/oneYear.ts'
];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Simple heuristic split by verse start
    // Assuming indentation consistency or just scanning
    // We can split by '    {\n        id: "'
    const parts = content.split(/id:\s*"/);

    // Skip the first part (imports/header)
    console.log(`File: ${file}, Parts: ${parts.length}`);
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const idEnd = part.indexOf('"');
        const id = part.substring(0, idEnd);

        // Check reference block
        // Regex might be too strict with whitespace?
        // Let's use indexOf
        const refStart = part.indexOf('reference: {');
        if (refStart !== -1) {
            const refEnd = part.indexOf('}', refStart);
            const refContent = part.substring(refStart, refEnd);
            if (!refContent.includes('de:') || !refContent.includes('fr:')) {
                console.log(`File: ${file}, ID: ${id}, Missing in reference`);
            }
        }

        // Check text block
        const textStart = part.indexOf('text: {');
        if (textStart !== -1) {
            const textEnd = part.indexOf('},', textStart); // assuming }, ends the block
            // strict text extraction for multiline
            const textContent = part.substring(textStart, textEnd);
            if (!textContent.includes('de:')) {
                console.log(`File: ${file}, ID: ${id}, Missing 'de' in text`);
            }
            if (!textContent.includes('fr:')) {
                console.log(`File: ${file}, ID: ${id}, Missing 'fr' in text`);
            }
        } else {
            console.log(`File: ${file}, ID: ${id}, No text block found`);
        }
    }
});
