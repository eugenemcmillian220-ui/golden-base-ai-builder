// Multi-format export system
// Supports exporting projects to React, Vue, Svelte, Vanilla JS, and more

export type ExportFormat = 
  | 'react-jsx'
  | 'react-tsx'
  | 'vue3'
  | 'svelte'
  | 'vanilla-js'
  | 'vanilla-html'
  | 'next-pages'
  | 'next-app'
  | 'astro'
  | 'html-css-js';

export interface ExportOptions {
  format: ExportFormat;
  includeStyles: boolean;
  includeDependencies: boolean;
  includePackageJson: boolean;
  minify: boolean;
  prettier: boolean;
}

export interface ExportedFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'config' | 'asset' | 'other';
}

export interface ExportResult {
  files: ExportedFile[];
  format: ExportFormat;
  packageJson?: Record<string, any>;
  readmeContent?: string;
}

/**
 * Export engine for converting code to different formats
 */
export class ExportEngine {
  /**
   * Export project to React (JSX)
   */
  static exportToReactJSX(code: string, componentName: string = 'Component'): ExportResult {
    const jsxCode = this.ensureReactImports(code);
    
    return {
      files: [
        {
          path: `src/components/${componentName}.jsx`,
          content: jsxCode,
          type: 'component',
        },
      ],
      format: 'react-jsx',
      packageJson: {
        name: 'react-component',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      },
    };
  }

  /**
   * Export project to React (TSX)
   */
  static exportToReactTSX(code: string, componentName: string = 'Component'): ExportResult {
    const tsxCode = this.ensureReactImports(code) + '\n\nexport default ' + componentName + ';';
    
    return {
      files: [
        {
          path: `src/components/${componentName}.tsx`,
          content: tsxCode,
          type: 'component',
        },
      ],
      format: 'react-tsx',
      packageJson: {
        name: 'react-component',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
        },
      },
    };
  }

  /**
   * Export project to Vue 3
   */
  static exportToVue3(code: string, componentName: string = 'Component'): ExportResult {
    const vueCode = `<template>
  <div class="component">
    ${code}
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Component logic here
</script>

<style scoped>
/* Component styles */
</style>`;

    return {
      files: [
        {
          path: `src/components/${componentName}.vue`,
          content: vueCode,
          type: 'component',
        },
      ],
      format: 'vue3',
      packageJson: {
        name: 'vue-component',
        version: '1.0.0',
        dependencies: {
          vue: '^3.0.0',
        },
      },
    };
  }

  /**
   * Export project to Svelte
   */
  static exportToSvelte(code: string, componentName: string = 'Component'): ExportResult {
    const svelteCode = `<script>
  // Component logic
</script>

${code}

<style>
  /* Component styles */
</style>`;

    return {
      files: [
        {
          path: `src/lib/${componentName}.svelte`,
          content: svelteCode,
          type: 'component',
        },
      ],
      format: 'svelte',
      packageJson: {
        name: 'svelte-component',
        version: '1.0.0',
        dependencies: {
          svelte: '^4.0.0',
        },
      },
    };
  }

  /**
   * Export project to Vanilla JavaScript
   */
  static exportToVanillaJS(code: string, fileName: string = 'component'): ExportResult {
    const jsCode = `// Vanilla JavaScript Component

class ${this.toPascalCase(fileName)} {
  constructor(selector) {
    this.element = document.querySelector(selector);
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    // Render component
    ${code}
  }

  attachEventListeners() {
    // Attach event listeners
  }

  destroy() {
    // Clean up
  }
}

// Export for use
export default ${this.toPascalCase(fileName)};`;

    return {
      files: [
        {
          path: `src/js/${fileName}.js`,
          content: jsCode,
          type: 'component',
        },
      ],
      format: 'vanilla-js',
    };
  }

  /**
   * Export project to Vanilla HTML/CSS/JS
   */
  static exportToVanillaHTML(code: string, styles: string = '', title: string = 'Component'): ExportResult {
    const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
    }

    ${styles}
  </style>
</head>
<body>
  <div id="root">
    ${code}
  </div>

  <script>
    // Component logic
  </script>
</body>
</html>`;

    return {
      files: [
        {
          path: 'index.html',
          content: htmlCode,
          type: 'component',
        },
      ],
      format: 'vanilla-html',
    };
  }

  /**
   * Export project to Next.js (Pages Router)
   */
  static exportToNextPages(code: string, pageName: string = 'index'): ExportResult {
    const nextCode = `import React from 'react'

export default function ${this.toPascalCase(pageName)}() {
  return (
    <div>
      ${code}
    </div>
  )
}`;

    return {
      files: [
        {
          path: `pages/${pageName}.jsx`,
          content: nextCode,
          type: 'component',
        },
      ],
      format: 'next-pages',
      packageJson: {
        name: 'next-app',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      },
    };
  }

  /**
   * Export project to Next.js (App Router)
   */
  static exportToNextApp(code: string, pageName: string = 'page'): ExportResult {
    const nextCode = `'use client'

export default function Page() {
  return (
    <div>
      ${code}
    </div>
  )
}`;

    return {
      files: [
        {
          path: `app/${pageName}/page.tsx`,
          content: nextCode,
          type: 'component',
        },
      ],
      format: 'next-app',
      packageJson: {
        name: 'next-app',
        version: '1.0.0',
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      },
    };
  }

  /**
   * Export project to Astro
   */
  static exportToAstro(code: string, componentName: string = 'Component'): ExportResult {
    const astroCode = `---
// Astro component

interface Props {
  title?: string;
}

const { title = 'Component' } = Astro.props;
---

<div class="component">
  ${code}
</div>

<style>
  /* Component styles */
</style>`;

    return {
      files: [
        {
          path: `src/components/${componentName}.astro`,
          content: astroCode,
          type: 'component',
        },
      ],
      format: 'astro',
      packageJson: {
        name: 'astro-project',
        version: '1.0.0',
        dependencies: {
          astro: '^4.0.0',
        },
      },
    };
  }

  /**
   * Generate package.json content
   */
  static generatePackageJson(format: ExportFormat, projectName: string = 'project'): string {
    const basePackage = {
      name: projectName,
      version: '1.0.0',
      description: 'Generated with Golden Base AI Builder',
      scripts: {
        dev: 'npm run start',
        build: 'npm run bundle',
        start: 'serve dist',
      },
    };

    const formatPackages: Record<ExportFormat, Record<string, any>> = {
      'react-jsx': {
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      },
      'react-tsx': {
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
        },
      },
      vue3: {
        dependencies: { vue: '^3.0.0' },
      },
      svelte: {
        dependencies: { svelte: '^4.0.0' },
      },
      'vanilla-js': {},
      'vanilla-html': {},
      'next-pages': {
        dependencies: { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' },
      },
      'next-app': {
        dependencies: { next: '^14.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' },
      },
      astro: {
        dependencies: { astro: '^4.0.0' },
      },
      'html-css-js': {},
    };

    const pkg = {
      ...basePackage,
      ...formatPackages[format],
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate README content
   */
  static generateReadme(projectName: string, format: ExportFormat): string {
    return `# ${projectName}

Generated with [Golden Base AI Builder](https://raccoonai.tech)

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

## Format: ${format}

This project was exported as a ${format} application.

### Structure

\`\`\`
.
├── src/
│   ├── components/
│   ├── styles/
│   └── index.${this.getFileExtension(format)}
├── package.json
└── README.md
\`\`\`

## Features

- Responsive design
- Modern tooling
- Ready to deploy

## License

MIT
`;
  }

  /**
   * Ensure React imports are present
   */
  private static ensureReactImports(code: string): string {
    if (!code.includes('import React')) {
      return `import React from 'react';\n\n${code}`;
    }
    return code;
  }

  /**
   * Convert to PascalCase
   */
  private static toPascalCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Get file extension for format
   */
  private static getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      'react-jsx': 'jsx',
      'react-tsx': 'tsx',
      'vue3': 'vue',
      'svelte': 'svelte',
      'vanilla-js': 'js',
      'vanilla-html': 'html',
      'next-pages': 'jsx',
      'next-app': 'tsx',
      'astro': 'astro',
      'html-css-js': 'html',
    };

    return extensions[format];
  }

  /**
   * Export to all formats at once
   */
  static exportToAllFormats(code: string, componentName: string = 'Component'): Record<ExportFormat, ExportResult> {
    return {
      'react-jsx': this.exportToReactJSX(code, componentName),
      'react-tsx': this.exportToReactTSX(code, componentName),
      'vue3': this.exportToVue3(code, componentName),
      'svelte': this.exportToSvelte(code, componentName),
      'vanilla-js': this.exportToVanillaJS(code, componentName),
      'vanilla-html': this.exportToVanillaHTML(code),
      'next-pages': this.exportToNextPages(code),
      'next-app': this.exportToNextApp(code),
      'astro': this.exportToAstro(code, componentName),
      'html-css-js': this.exportToVanillaHTML(code),
    };
  }
}
