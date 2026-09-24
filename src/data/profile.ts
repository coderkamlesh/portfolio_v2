// Single source of truth for portfolio content.
// TODO: replace the placeholder email and sample projects with real data.
export interface NavItem {
  label: string;
  href: string;
}

export interface Project {
  title: string;
  description: string;
  tech: string[];
}

export interface Profile {
  name: string;
  role: string;
  location: string;
  summary: string;
  bio: string[];
  stack: string[];
  nav: NavItem[];
  email: string;
  projects: Project[];
}

export const profile: Profile = {
  name: 'Kamlesh',
  role: 'Software Developer',
  location: 'Noida, India',
  summary:
    'I build reliable backends with Java and Spring Boot, and clean, fast interfaces with React.',
  bio: [
    'I am a software developer based in Noida, India. My core stack is Java and Spring Boot on the backend and React on the frontend.',
    'I am currently learning Go, and I care about first-principles design, readable code, and systems that are easy to operate.',
  ],
  stack: ['Java', 'Spring Boot', 'React', 'TypeScript', 'SolidJS', 'Go', 'PostgreSQL'],
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
  email: 'your-email@example.com',
  projects: [
    {
      title: 'Portfolio v2',
      description:
        'Personal portfolio built with SolidJS and Vite. Custom CSS theme, no UI framework.',
      tech: ['SolidJS', 'TypeScript', 'Vite', 'CSS Modules'],
    },
    {
      title: 'Sample project',
      description:
        'Placeholder card — replace with a real project and one line on what it does.',
      tech: ['Java', 'Spring Boot'],
    },
  ],
};
