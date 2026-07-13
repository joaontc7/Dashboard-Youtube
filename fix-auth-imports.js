const fs = require('fs');
const path = require('path');

function replaceImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceImports(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace various relative paths to authOptions
            const patterns = [
                { regex: /from\s+['"]\.\.\/\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g, rep: 'from "@/app/lib/auth"' },
                { regex: /from\s+['"]\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g, rep: 'from "@/app/lib/auth"' },
                { regex: /from\s+['"]\.\/api\/auth\/\[\.\.\.nextauth\]\/route['"]/g, rep: 'from "@/app/lib/auth"' },
                { regex: /from\s+['"]\.\.\/api\/auth\/\[\.\.\.nextauth\]\/route['"]/g, rep: 'from "@/app/lib/auth"' }
            ];

            for (const p of patterns) {
                if (p.regex.test(content)) {
                    content = content.replace(p.regex, p.rep);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

replaceImports('./src');
