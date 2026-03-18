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

// System prompts for each framework
export const TIER_FEATURES = {
  free: {
    generations: 5,
    models: ['gpt-3.5-turbo'],
    maxTokens: 2000,
    features: ['basic_generation', 'preview']
  },
  pro: {
    generations: 50,
    models: ['gpt-3.5-turbo', 'gpt-4'],
    maxTokens: 4000,
    features: ['basic_generation', 'preview', 'export', 'templates']
  },
  business: {
    generations: 500,
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    maxTokens: 8000,
    features: ['all']
  }
};

export function getSystemPrompt(framework: Framework): string {
  const prompts: Record<Framework, string> = {
    react: `You are an expert React developer. Generate clean, modern React code using:
- Functional components with hooks (useState, useEffect, useContext)
- React best practices and component composition
- Proper props handling and TypeScript types
- No class components or outdated patterns
- Modern ES6+ syntax
- Responsive design with Tailwind
- Accessibility considerations`,
    
    vue: `You are an expert Vue.js developer. Generate clean, modern Vue 3 code using:
- Composition API (ref, computed, watch)
- Single File Components (.vue)
- Proper template syntax and v-directives
- Reactive state management
- Modern ES6+ syntax`,
    
    svelte: `You are an expert Svelte developer. Generate clean, modern Svelte code using:
- Reactive variables and stores
- Component composition
- Proper event handling
- Scoped styling
- Modern JavaScript patterns`,
    
    vanilla: `You are an expert JavaScript developer. Generate clean, vanilla JavaScript code using:
- ES6+ modules and syntax
- Proper DOM manipulation
- Event handling
- Responsive design with CSS Grid/Flexbox
- No external frameworks`
  };
  
  return prompts[framework];
}

export function createEnhancedPrompt(
  basePrompt: string,
  framework: Framework,
  designSystem: DesignSystem,
  additionalContext?: string
): string {
  const systemPrompt = getSystemPrompt(framework);
  
  return `${systemPrompt}

Design System: ${designSystem}
Base Request: ${basePrompt}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate only the code without markdown formatting or explanations.`;
}

export const FRAMEWORK_TEMPLATES: Record<Framework, FrameworkTemplate> = {
  react: {
    id: 'react',
    name: 'React',
    description: 'React with Hooks',
    fileExtension: '.jsx',
    packageManager: 'npm',
    setupInstructions: 'npx create-react-app',
    systemPrompt: getSystemPrompt('react'),
    exampleCode: 'export default function App() { return <div>Hello</div>; }'
  },
  vue: {
    id: 'vue',
    name: 'Vue 3',
    description: 'Vue 3 with Composition API',
    fileExtension: '.vue',
    packageManager: 'npm',
    setupInstructions: 'npm create vue@latest',
    systemPrompt: getSystemPrompt('vue'),
    exampleCode: '<template><div>Hello</div></template>'
  },
  svelte: {
    id: 'svelte',
    name: 'Svelte',
    description: 'Svelte reactive framework',
    fileExtension: '.svelte',
    packageManager: 'npm',
    setupInstructions: 'npm create vite@latest -- --template svelte',
    systemPrompt: getSystemPrompt('svelte'),
    exampleCode: '<script>let count = 0;</script><div>{count}</div>'
  },
  vanilla: {
    id: 'vanilla',
    name: 'Vanilla JS',
    description: 'Pure JavaScript',
    fileExtension: '.js',
    packageManager: 'npm',
    setupInstructions: 'npm init -y',
    systemPrompt: getSystemPrompt('vanilla'),
    exampleCode: 'document.body.innerHTML = "<div>Hello</div>";'
  }
};

export const DESIGN_SYSTEMS: Record<DesignSystem, DesignSystemTemplate> = {
  tailwind: {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS',
    cssFramework: 'tailwindcss',
    setupCode: 'npm install -D tailwindcss',
    componentLibrary: 'headless UI',
    utilities: ['flex', 'grid', 'p-', 'text-', 'bg-']
  },
  bootstrap: {
    id: 'bootstrap',
    name: 'Bootstrap',
    description: 'Component-based CSS framework',
    cssFramework: 'bootstrap',
    setupCode: 'npm install bootstrap',
    componentLibrary: 'bootstrap components',
    utilities: ['container', 'row', 'col', 'alert', 'button']
  },
  shadcn: {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'Headless UI component library',
    cssFramework: 'tailwindcss',
    setupCode: 'npx shadcn-ui@latest init',
    componentLibrary: 'shadcn/ui',
    utilities: ['Button', 'Card', 'Input', 'Dialog']
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Custom CSS/styling',
    cssFramework: 'custom',
    setupCode: '',
    componentLibrary: 'custom',
    utilities: []
  }
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'landing',
    description: 'Beautiful landing page with hero and features',
    basePrompt: 'Create a modern landing page with hero section, features grid, and call-to-action',
    frameworks: ['react', 'vue', 'svelte'],
    designSystems: ['tailwind', 'shadcn'],
    exampleOutput: 'A responsive landing page with gradient hero and 3-column feature grid'
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    category: 'dashboard',
    description: 'Analytics dashboard with charts and metrics',
    basePrompt: 'Create an admin dashboard with metrics cards, charts, and data tables',
    frameworks: ['react', 'vue'],
    designSystems: ['tailwind', 'shadcn'],
    exampleOutput: 'Dashboard with 4 metric cards and recharts integration'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    category: 'ecommerce',
    description: 'Product listing and shopping cart',
    basePrompt: 'Create an e-commerce product grid with filters and shopping cart',
    frameworks: ['react', 'vue', 'svelte'],
    designSystems: ['tailwind', 'bootstrap'],
    exampleOutput: 'Product grid with add to cart functionality'
  }
];
