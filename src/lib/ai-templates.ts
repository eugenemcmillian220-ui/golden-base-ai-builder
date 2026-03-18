// Framework-specific templates and system prompts for AI code generation

export type Framework = 'react' | 'vue' | 'svelte' | 'vanilla';
export type DesignSystem = 'tailwind' | 'bootstrap' | 'shadcn' | 'custom';
export type TemplateCategory = 'landing' | 'dashboard' | 'ecommerce' | 'admin' | 'marketing' | 'form';

export interface FrameworkTemplate {
  id: Framework;
  name: string;
  description: string;
  fileExtension: string;
  packageManager: 'npm' | 'pnpm';
  setupInstructions: string;
  systemPrompt: string;
  exampleCode: string;
}

export interface DesignSystemTemplate {
  id: DesignSystem;
  name: string;
  description: string;
  cssFramework: string;
  setupCode: string;
  componentLibrary: string;
  utilities: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  basePrompt: string;
  frameworks: Framework[];
  designSystems: DesignSystem[];
  exampleOutput?: string;
}

// Framework Templates with System Prompts
export const FRAMEWORK_TEMPLATES: Record<Framework, FrameworkTemplate> = {
  react: {
    id: 'react',
    name: 'React (JavaScript)',
    description: 'Modern React with hooks and functional components',
    fileExtension: '.jsx',
    packageManager: 'npm',
    setupInstructions: 'npx create-react-app my-app',
    systemPrompt: `You are an expert React developer. Generate clean, modern React code using:
- Functional components with hooks (useState, useEffect, useContext)
- React best practices and component composition
- Proper props handling and TypeScript types when applicable
- No class components or outdated patterns
- Modern ES6+ syntax
- Responsive design with Tailwind or Bootstrap
- Accessibility (a11y) considerations
Only output the JSX/JavaScript code without markdown formatting.`,
    exampleCode: `export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <button onClick={() => setCount(count + 1)}>Click me: {count}</button>
    </div>
  );
}`,
  },
  vue: {
    id: 'vue',
    name: 'Vue 3 (JavaScript)',
    description: 'Vue 3 with Composition API',
    fileExtension: '.vue',
    packageManager: 'npm',
    setupInstructions: 'npm create vue@latest',
    systemPrompt: `You are an expert Vue.js developer. Generate clean, modern Vue 3 code using:
- Composition API (ref, computed, watch)
- Single File Components (.vue)
- Proper template syntax and v-directives
- Reactive state management
- Modern ES6+ syntax
- Responsive design with Tailwind or Bootstrap
- Accessibility (a11y) considerations
Output the complete <template>, <script setup>, and <style> blocks in proper Vue syntax.`,
    exampleCode: `<template>
  <div class="flex items-center justify-center min-h-screen">
    <button @click="count++" class="px-4 py-2 bg-blue-500 text-white rounded">
      Click me: {{ count }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>`,
  },
  svelte: {
    id: 'svelte',
    name: 'Svelte (JavaScript)',
    description: 'Svelte with reactive variables',
    fileExtension: '.svelte',
    packageManager: 'npm',
    setupInstructions: 'npm create vite@latest -- --template svelte',
    systemPrompt: `You are an expert Svelte developer. Generate clean, modern Svelte code using:
- Reactive variables with let declarations
- Svelte directives (on:, bind:, if:, each:)
- Store patterns when needed
- Scoped styling
- Modern ES6+ syntax
- Responsive design with Tailwind or Bootstrap
- Accessibility (a11y) considerations
Output the complete Svelte component with <script>, markup, and <style> blocks.`,
    exampleCode: `<script>
  let count = 0;
  
  function increment() {
    count++;
  }
</script>

<div class="flex items-center justify-center min-h-screen">
  <button on:click={increment} class="px-4 py-2 bg-blue-500 text-white rounded">
    Click me: {count}
  </button>
</div>

<style>
  :global(body) {
    margin: 0;
  }
</style>`,
  },
  vanilla: {
    id: 'vanilla',
    name: 'Vanilla JavaScript',
    description: 'Pure HTML/CSS/JavaScript',
    fileExtension: '.html',
    packageManager: 'npm',
    setupInstructions: 'Create an index.html file',
    systemPrompt: `You are an expert vanilla JavaScript developer. Generate clean, semantic HTML with modern JavaScript:
- Semantic HTML5 structure
- Modern ES6+ JavaScript (no jQuery)
- DOM manipulation with native APIs
- Event handling best practices
- Responsive CSS Grid/Flexbox
- Accessibility (a11y) considerations
- Module pattern for organization
Output complete HTML, CSS, and JavaScript code. Include <!DOCTYPE html> and proper structure.`,
    exampleCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    button { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
  </style>
</head>
<body>
  <button id="btn">Click me: 0</button>
  <script>
    let count = 0;
    const btn = document.getElementById('btn');
    btn.addEventListener('click', () => {
      count++;
      btn.textContent = \`Click me: \${count}\`;
    });
  </script>
</body>
</html>`,
  },
};

// Design System Templates
export const DESIGN_SYSTEM_TEMPLATES: Record<DesignSystem, DesignSystemTemplate> = {
  tailwind: {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    cssFramework: 'tailwindcss',
    setupCode: `<script src="https://cdn.tailwindcss.com"></script>`,
    componentLibrary: 'Built-in utilities',
    utilities: [
      'flex',
      'grid',
      'p-4',
      'bg-blue-500',
      'text-white',
      'rounded',
      'hover:bg-blue-600',
      'transition-all',
      'shadow-lg',
      'border-2',
    ],
  },
  bootstrap: {
    id: 'bootstrap',
    name: 'Bootstrap',
    description: 'Popular CSS framework',
    cssFramework: 'bootstrap',
    setupCode: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">`,
    componentLibrary: 'Bootstrap components',
    utilities: [
      'd-flex',
      'justify-content-center',
      'align-items-center',
      'btn',
      'btn-primary',
      'container',
      'row',
      'col',
      'mb-3',
      'mt-5',
    ],
  },
  shadcn: {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'Radix UI + Tailwind components',
    cssFramework: 'tailwindcss + radix-ui',
    setupCode: `npx shadcn-ui@latest init`,
    componentLibrary: 'Pre-built accessible components',
    utilities: [
      'Button',
      'Card',
      'Dialog',
      'Form',
      'Input',
      'Select',
      'Sheet',
      'Tabs',
      'Dropdown Menu',
      'Popover',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom CSS',
    description: 'User-defined design system',
    cssFramework: 'custom',
    setupCode: `<!-- Include your custom CSS -->
<link rel="stylesheet" href="styles.css">`,
    componentLibrary: 'Custom components',
    utilities: [
      'var(--primary-color)',
      'var(--spacing)',
      'var(--font-family)',
      'var(--border-radius)',
      'custom classes',
    ],
  },
};

// Prompt Templates for Common Use Cases
export const PROMPT_TEMPLATES: Record<TemplateCategory, PromptTemplate[]> = {
  landing: [
    {
      id: 'landing-hero',
      name: 'Landing Page with Hero Section',
      category: 'landing',
      description: 'Modern landing page with hero section, features, and CTA',
      basePrompt: `Create a modern landing page with:
- Hero section with headline, subheading, and CTA button
- Features section (3-4 key features with icons)
- Testimonials section
- Footer with links
Make it visually appealing, responsive, and professional.`,
      frameworks: ['react', 'vue', 'svelte', 'vanilla'],
      designSystems: ['tailwind', 'bootstrap', 'shadcn'],
    },
  ],
  dashboard: [
    {
      id: 'dashboard-admin',
      name: 'Admin Dashboard',
      category: 'dashboard',
      description: 'Admin dashboard with charts, tables, and metrics',
      basePrompt: `Create an admin dashboard with:
- Header with navigation and user menu
- Sidebar with menu items
- Main content area with cards showing metrics
- A data table with sorting/filtering
- Charts/graphs for data visualization
Include responsive design and dark mode support.`,
      frameworks: ['react', 'vue', 'svelte'],
      designSystems: ['tailwind', 'bootstrap', 'shadcn'],
    },
  ],
  ecommerce: [
    {
      id: 'ecommerce-product',
      name: 'Product Page',
      category: 'ecommerce',
      description: 'E-commerce product page with details and reviews',
      basePrompt: `Create an e-commerce product page with:
- Product image gallery
- Product details (name, price, description)
- Quantity selector and "Add to Cart" button
- Product specifications table
- Customer reviews section
- Related products carousel
Make it responsive and user-friendly.`,
      frameworks: ['react', 'vue', 'svelte'],
      designSystems: ['tailwind', 'bootstrap', 'shadcn'],
    },
  ],
  admin: [
    {
      id: 'admin-panel',
      name: 'Admin Control Panel',
      category: 'admin',
      description: 'Administrative control panel for content management',
      basePrompt: `Create an admin control panel with:
- User management table with add/edit/delete
- Settings page with form inputs
- Logs/activity viewer
- Search and filtering capabilities
- Bulk actions support
Include proper forms, modals, and confirmations.`,
      frameworks: ['react', 'vue'],
      designSystems: ['tailwind', 'shadcn'],
    },
  ],
  marketing: [
    {
      id: 'marketing-blog',
      name: 'Blog Landing Page',
      category: 'marketing',
      description: 'Blog landing with featured posts and categories',
      basePrompt: `Create a blog landing page with:
- Featured blog post showcase
- Blog post grid/list (with images, titles, excerpts)
- Category filter/navigation
- Search functionality
- Newsletter signup section
- Footer with social links
Make it clean, readable, and SEO-friendly.`,
      frameworks: ['react', 'vue', 'svelte', 'vanilla'],
      designSystems: ['tailwind', 'bootstrap'],
    },
  ],
  form: [
    {
      id: 'form-contact',
      name: 'Contact Form',
      category: 'form',
      description: 'Contact form with validation and submission',
      basePrompt: `Create a contact form with:
- Name, email, subject, and message fields
- Form validation (required fields, email format)
- Submit button with loading state
- Success/error messages
- Responsive design
Include proper accessibility and user feedback.`,
      frameworks: ['react', 'vue', 'svelte', 'vanilla'],
      designSystems: ['tailwind', 'bootstrap', 'shadcn'],
    },
  ],
};

// Helper function to get system prompt for generation
export function getSystemPrompt(
  framework: Framework,
  designSystem: DesignSystem,
  template?: PromptTemplate
): string {
  const frameworkTemplate = FRAMEWORK_TEMPLATES[framework];
  const designSystemTemplate = DESIGN_SYSTEM_TEMPLATES[designSystem];

  let systemPrompt = frameworkTemplate.systemPrompt;

  // Append design system instructions
  systemPrompt += `\n\nUse ${designSystemTemplate.name} for styling. Available utilities: ${designSystemTemplate.utilities.join(', ')}`;

  // Add template-specific instructions if provided
  if (template) {
    systemPrompt += `\n\nTemplate: ${template.name}\nDescription: ${template.description}`;
  }

  systemPrompt += '\n\nGenerate ONLY the code without any markdown formatting, explanations, or code blocks.';

  return systemPrompt;
}

// Helper function to create enhanced user prompt
export function createEnhancedPrompt(
  userPrompt: string,
  framework: Framework,
  template?: PromptTemplate
): string {
  let enhancedPrompt = userPrompt;

  if (template) {
    enhancedPrompt = `${template.basePrompt}\n\nUser request: ${userPrompt}`;
  }

  return enhancedPrompt;
}

// Feature access by subscription tier
export const TIER_FEATURES: Record<string, { frameworks: Framework[]; designSystems: DesignSystem[] }> = {
  free: {
    frameworks: ['react', 'vanilla'],
    designSystems: ['tailwind'],
  },
  pro: {
    frameworks: ['react', 'vue', 'svelte', 'vanilla'],
    designSystems: ['tailwind', 'bootstrap', 'shadcn'],
  },
  business: {
    frameworks: ['react', 'vue', 'svelte', 'vanilla'],
    designSystems: ['tailwind', 'bootstrap', 'shadcn', 'custom'],
  },
  enterprise: {
    frameworks: ['react', 'vue', 'svelte', 'vanilla'],
    designSystems: ['tailwind', 'bootstrap', 'shadcn', 'custom'],
  },
};
