export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  coverImage: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  date: string;
  links?: {
    github?: string;
    live?: string;
    behance?: string;
  };
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: 'aurora-design-system',
    title: 'Aurora Design System',
    shortDescription: 'A comprehensive design system built for modern web applications with accessibility at its core.',
    fullDescription: 'Aurora is a complete design system created to streamline development workflows and ensure consistent user experiences across multiple products. Built with React and TypeScript, it features over 50 customizable components, comprehensive documentation, and built-in accessibility features that meet WCAG 2.1 AA standards. The system includes a robust token architecture, allowing teams to maintain brand consistency while supporting multiple themes.',
    tags: ['Design System', 'React', 'TypeScript', 'Accessibility'],
    coverImage: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1545235617-7a424c1a60cc?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=800&fit=crop' },
    ],
    date: '2024-03-15',
    links: {
      github: 'https://github.com',
      live: 'https://example.com',
    },
    featured: true,
  },
  {
    slug: 'nexus-mobile-app',
    title: 'Nexus Mobile App',
    shortDescription: 'Cross-platform mobile application for seamless team collaboration and project management.',
    fullDescription: 'Nexus revolutionizes team collaboration with an intuitive mobile-first approach. Built using React Native, the app provides real-time synchronization, offline support, and a beautiful interface that works flawlessly on both iOS and Android. Features include task management, team chat, file sharing, and advanced analytics. The app handles complex state management with Redux and implements end-to-end encryption for sensitive data.',
    tags: ['Mobile', 'React Native', 'Real-time', 'UX'],
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&h=800&fit=crop' },
    ],
    date: '2024-02-20',
    links: {
      live: 'https://example.com',
    },
    featured: true,
  },
  {
    slug: 'quantum-analytics-dashboard',
    title: 'Quantum Analytics Dashboard',
    shortDescription: 'Advanced data visualization platform for enterprise analytics and business intelligence.',
    fullDescription: 'Quantum Analytics is a sophisticated dashboard platform designed for enterprise-level data analysis. The application processes millions of data points in real-time, presenting insights through interactive charts, graphs, and custom visualizations. Built with Next.js and D3.js, it features advanced filtering, custom report generation, and AI-powered trend detection. The platform integrates with major data sources and provides role-based access control for team collaboration.',
    tags: ['Analytics', 'Data Viz', 'Next.js', 'Enterprise'],
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop' },
    ],
    date: '2024-01-10',
    links: {
      github: 'https://github.com',
      live: 'https://example.com',
    },
    featured: true,
  },
  {
    slug: 'echo-sound-studio',
    title: 'Echo Sound Studio',
    shortDescription: 'Professional audio editing suite for creators and musicians.',
    fullDescription: 'Echo Sound Studio brings professional-grade audio editing to the web. This progressive web app leverages the Web Audio API to provide real-time audio processing, multi-track editing, and a comprehensive suite of effects and plugins. Features include waveform visualization, spectral analysis, batch processing, and export to multiple formats. The interface is designed for both beginners and professionals, with customizable workspaces and keyboard shortcuts.',
    tags: ['Audio', 'Web Audio API', 'PWA', 'Creative'],
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=1200&h=800&fit=crop' },
    ],
    date: '2023-12-05',
    featured: false,
  },
  {
    slug: 'vortex-ecommerce',
    title: 'Vortex E-commerce',
    shortDescription: 'Next-generation shopping experience with AI-powered recommendations.',
    fullDescription: 'Vortex redefines online shopping with intelligent product discovery and personalized experiences. The platform uses machine learning to understand customer preferences and provide relevant recommendations. Built on a modern JAMstack architecture with Next.js and headless CMS, it delivers lightning-fast page loads and SEO optimization. Features include advanced search, virtual try-on, augmented reality product previews, and seamless checkout flow.',
    tags: ['E-commerce', 'AI/ML', 'Next.js', 'AR'],
    coverImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=800&fit=crop' },
    ],
    date: '2023-11-18',
    links: {
      live: 'https://example.com',
    },
    featured: false,
  },
  {
    slug: 'zenith-fitness-tracker',
    title: 'Zenith Fitness Tracker',
    shortDescription: 'Smart fitness companion with personalized workout plans and health insights.',
    fullDescription: 'Zenith Fitness Tracker helps users achieve their health goals with data-driven insights and personalized guidance. The app integrates with wearable devices, tracks workouts, monitors nutrition, and provides AI-generated workout plans tailored to individual fitness levels. Built with React and TypeScript, it features beautiful data visualizations, social challenges, and a supportive community platform. The app also includes meditation guides and sleep tracking for holistic wellness.',
    tags: ['Health', 'Mobile', 'IoT', 'AI'],
    coverImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=800&fit=crop' },
    ],
    date: '2023-10-22',
    featured: false,
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectTags(): string[] {
  const tagSet = new Set<string>();
  projects.forEach((project) => {
    project.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
