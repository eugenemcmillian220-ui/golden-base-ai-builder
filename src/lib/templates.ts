// Project templates for quick-start projects
// Pre-built templates for Landing Page, SaaS Dashboard, E-commerce, Admin Panel

export type TemplateCategory = 
  | 'landing'
  | 'saas'
  | 'ecommerce'
  | 'admin'
  | 'portfolio'
  | 'documentation'
  | 'blog'
  | 'social';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  framework: 'react' | 'vue' | 'svelte' | 'next' | 'astro';
  designSystem: 'tailwind' | 'bootstrap' | 'shadcn' | 'custom';
  files: TemplateFile[];
  metadata: {
    author: string;
    version: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface TemplateFile {
  path: string;
  content: string;
  description?: string;
}

/**
 * Template library with pre-built projects
 */
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  // Landing Page Template
  'landing-page': {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Beautiful landing page with hero, features, and CTA sections',
    category: 'landing',
    framework: 'react',
    designSystem: 'tailwind',
    metadata: {
      author: 'Golden Base',
      version: '1.0.0',
      tags: ['landing', 'marketing', 'hero', 'responsive'],
      difficulty: 'beginner',
    },
    files: [
      {
        path: 'src/components/Hero.jsx',
        content: `export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6">Build Amazing Web Apps</h1>
        <p className="text-xl text-gray-300 mb-8">Create stunning web applications with AI-powered code generation</p>
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg">
          Get Started
        </button>
      </div>
    </div>
  );
}`,
        description: 'Hero section with headline and CTA button',
      },
      {
        path: 'src/components/Features.jsx',
        content: `export default function Features() {
  const features = [
    { title: 'Fast', description: 'Lightning quick generation' },
    { title: 'Easy', description: 'Simple and intuitive interface' },
    { title: 'Powerful', description: 'Full-featured code generation' },
  ];

  return (
    <div className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
        description: 'Features section with feature cards',
      },
    ],
  },

  // SaaS Dashboard Template
  'saas-dashboard': {
    id: 'saas-dashboard',
    name: 'SaaS Dashboard',
    description: 'Complete SaaS dashboard with analytics, users, and settings',
    category: 'saas',
    framework: 'react',
    designSystem: 'tailwind',
    metadata: {
      author: 'Golden Base',
      version: '1.0.0',
      tags: ['saas', 'dashboard', 'analytics', 'admin'],
      difficulty: 'intermediate',
    },
    files: [
      {
        path: 'src/components/Dashboard.jsx',
        content: `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const data = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 800 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Total Users</p>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Revenue</p>
          <p className="text-3xl font-bold">$45,678</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Growth</p>
          <p className="text-3xl font-bold">+23%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}`,
        description: 'SaaS dashboard with metrics and chart',
      },
    ],
  },

  // E-commerce Template
  'ecommerce-store': {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'E-commerce product page with product grid and cart',
    category: 'ecommerce',
    framework: 'react',
    designSystem: 'tailwind',
    metadata: {
      author: 'Golden Base',
      version: '1.0.0',
      tags: ['ecommerce', 'shop', 'products', 'cart'],
      difficulty: 'intermediate',
    },
    files: [
      {
        path: 'src/components/ProductGrid.jsx',
        content: `export default function ProductGrid() {
  const products = [
    { id: 1, name: 'Product 1', price: 29.99, image: 'https://via.placeholder.com/300x300' },
    { id: 2, name: 'Product 2', price: 39.99, image: 'https://via.placeholder.com/300x300' },
    { id: 3, name: 'Product 3', price: 49.99, image: 'https://via.placeholder.com/300x300' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Shop</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
            <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">\${product.price}</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
        description: 'Product grid with add to cart buttons',
      },
    ],
  },

  // Admin Panel Template
  'admin-panel': {
    id: 'admin-panel',
    name: 'Admin Panel',
    description: 'Admin panel with user management and data tables',
    category: 'admin',
    framework: 'react',
    designSystem: 'tailwind',
    metadata: {
      author: 'Golden Base',
      version: '1.0.0',
      tags: ['admin', 'users', 'management', 'data-table'],
      difficulty: 'advanced',
    },
    files: [
      {
        path: 'src/components/AdminPanel.jsx',
        content: `export default function AdminPanel() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{user.name}</td>
                <td className="px-6 py-3 text-sm">{user.email}</td>
                <td className="px-6 py-3 text-sm">{user.role}</td>
                <td className="px-6 py-3 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
        description: 'Admin panel with user management table',
      },
    ],
  },

  // Portfolio Template
  'portfolio': {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Developer portfolio with projects showcase',
    category: 'portfolio',
    framework: 'react',
    designSystem: 'tailwind',
    metadata: {
      author: 'Golden Base',
      version: '1.0.0',
      tags: ['portfolio', 'showcase', 'projects'],
      difficulty: 'beginner',
    },
    files: [
      {
        path: 'src/components/Portfolio.jsx',
        content: `export default function Portfolio() {
  const projects = [
    { title: 'Project 1', description: 'Amazing web app', image: 'https://via.placeholder.com/300x200' },
    { title: 'Project 2', description: 'Mobile application', image: 'https://via.placeholder.com/300x200' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-4">My Portfolio</h1>
        <p className="text-center text-gray-600 mb-12">Check out my latest projects</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div key={project.title} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
              <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
        description: 'Portfolio showcase page',
      },
    ],
  },
};

/**
 * Template engine
 */
export class TemplateEngine {
  /**
   * Get all templates
   */
  static getAllTemplates(): ProjectTemplate[] {
    return Object.values(PROJECT_TEMPLATES);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
    return this.getAllTemplates().filter((t) => t.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): ProjectTemplate | null {
    return PROJECT_TEMPLATES[id] || null;
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): ProjectTemplate[] {
    const q = query.toLowerCase();
    return this.getAllTemplates().filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.metadata.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  /**
   * Get templates by difficulty
   */
  static getTemplatesByDifficulty(
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): ProjectTemplate[] {
    return this.getAllTemplates().filter((t) => t.metadata.difficulty === difficulty);
  }

  /**
   * Get unique categories
   */
  static getCategories(): TemplateCategory[] {
    const categories = new Set(this.getAllTemplates().map((t) => t.category));
    return Array.from(categories);
  }

  /**
   * Generate project from template
   */
  static generateProjectFromTemplate(
    templateId: string,
    projectName: string
  ): { files: TemplateFile[]; metadata: any } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      files: template.files.map((file) => ({
        ...file,
        path: file.path.replace('src/', `projects/${projectName}/src/`),
      })),
      metadata: {
        ...template.metadata,
        projectName,
        createdFrom: templateId,
        createdAt: new Date(),
      },
    };
  }
}
