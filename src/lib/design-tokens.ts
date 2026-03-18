// Design tokens management and utilities

export type TokenCategory = 'colors' | 'typography' | 'spacing' | 'borders' | 'shadows';

export interface ColorToken {
  name: string;
  value: string;
  description?: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
}

export interface TypographyToken {
  name: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  description?: string;
}

export interface SpacingToken {
  name: string;
  value: string;
  description?: string;
}

export interface DesignTokenSet {
  id: string;
  name: string;
  description?: string;
  category: TokenCategory;
  tokens: Record<string, ColorToken | TypographyToken | SpacingToken>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Default design tokens
export const DEFAULT_DESIGN_TOKENS: Record<string, DesignTokenSet> = {
  colors: {
    id: 'colors-default',
    name: 'Default Color Palette',
    category: 'colors',
    description: 'Default color tokens for the design system',
    tokens: {
      primary: {
        name: 'Primary',
        value: '#3B82F6',
        category: 'primary',
        description: 'Primary brand color',
      },
      secondary: {
        name: 'Secondary',
        value: '#6B7280',
        category: 'secondary',
        description: 'Secondary color for UI elements',
      },
      accent: {
        name: 'Accent',
        value: '#8B5CF6',
        category: 'accent',
        description: 'Accent color for highlights',
      },
      success: {
        name: 'Success',
        value: '#10B981',
        category: 'semantic',
        description: 'Color for success states',
      },
      warning: {
        name: 'Warning',
        value: '#F59E0B',
        category: 'semantic',
        description: 'Color for warning states',
      },
      error: {
        name: 'Error',
        value: '#EF4444',
        category: 'semantic',
        description: 'Color for error states',
      },
      neutral: {
        name: 'Neutral',
        value: '#F3F4F6',
        category: 'neutral',
        description: 'Neutral background color',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  typography: {
    id: 'typography-default',
    name: 'Default Typography',
    category: 'typography',
    description: 'Default typography tokens',
    tokens: {
      h1: {
        name: 'Heading 1',
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: '1.2',
        description: 'Large heading',
      },
      h2: {
        name: 'Heading 2',
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: '1.3',
        description: 'Secondary heading',
      },
      h3: {
        name: 'Heading 3',
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: '1.4',
        description: 'Tertiary heading',
      },
      body: {
        name: 'Body',
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: '1.6',
        description: 'Body text',
      },
      small: {
        name: 'Small',
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: '1.5',
        description: 'Small text',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  spacing: {
    id: 'spacing-default',
    name: 'Default Spacing',
    category: 'spacing',
    description: 'Default spacing tokens',
    tokens: {
      xs: {
        name: 'XS',
        value: '0.25rem',
        description: 'Extra small spacing (4px)',
      },
      sm: {
        name: 'SM',
        value: '0.5rem',
        description: 'Small spacing (8px)',
      },
      md: {
        name: 'MD',
        value: '1rem',
        description: 'Medium spacing (16px)',
      },
      lg: {
        name: 'LG',
        value: '1.5rem',
        description: 'Large spacing (24px)',
      },
      xl: {
        name: 'XL',
        value: '2rem',
        description: 'Extra large spacing (32px)',
      },
      '2xl': {
        name: '2XL',
        value: '3rem',
        description: 'Double extra large spacing (48px)',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
};

// Export design tokens as CSS
export function exportTokensAsCSS(tokenSet: DesignTokenSet): string {
  const cssVariables: string[] = [':root {'];

  Object.entries(tokenSet.tokens).forEach(([key, token]) => {
    if ('value' in token) {
      cssVariables.push(`  --token-${key}: ${token.value};`);
    } else if ('fontSize' in token) {
      cssVariables.push(`  --token-${key}-font-size: ${token.fontSize};`);
      cssVariables.push(`  --token-${key}-font-weight: ${token.fontWeight};`);
      cssVariables.push(`  --token-${key}-line-height: ${token.lineHeight};`);
    }
  });

  cssVariables.push('}');
  return cssVariables.join('\n');
}

// Export design tokens as JSON
export function exportTokensAsJSON(tokenSet: DesignTokenSet): string {
  const json = {
    name: tokenSet.name,
    category: tokenSet.category,
    tokens: tokenSet.tokens,
  };
  return JSON.stringify(json, null, 2);
}

// Convert design tokens to Tailwind configuration
export function exportTokensAsTailwind(tokenSet: DesignTokenSet): Record<string, string> {
  const tailwindConfig: Record<string, string> = {};

  Object.entries(tokenSet.tokens).forEach(([key, token]) => {
    if ('value' in token && tokenSet.category === 'colors') {
      tailwindConfig[key] = token.value;
    }
  });

  return tailwindConfig;
}

// Validate color hex value
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

// Validate RGB color value
export function isValidRGBColor(color: string): boolean {
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const match = color.match(rgbRegex);
  if (!match) return false;

  const [, r, g, b] = match;
  return parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255;
}

// Validate design token value
export function isValidTokenValue(value: string, category: TokenCategory): boolean {
  switch (category) {
    case 'colors':
      return isValidHexColor(value) || isValidRGBColor(value) || value.startsWith('var(');
    case 'spacing':
    case 'borders':
    case 'shadows':
      return /^(\d+\.?\d*)(px|rem|em|%)$/.test(value);
    default:
      return true;
  }
}
