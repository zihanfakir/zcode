export interface ProjectItem {
  num: string;
  slug: string;
  name: string;
  description: string;
  stack: string[];
  repo?: string;
  liveUrl?: string;
  accent: string;
  themeColor: string;
  role: string;
  year: string;
}

export const PROJECTS: ProjectItem[] = [
  {
    num: "01",
    slug: "ai-zihan-xyz",
    name: "AI Multi-Model Engine",
    description: "Next-generation AI chat platform integrating 11 neural models with real-time streaming, secure session states, and custom agent prompts.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Groq / OpenAI", "MongoDB"],
    repo: "https://github.com/zihanfakir/ai.zihan.xyz",
    liveUrl: "https://ai.zihan.xyz",
    accent: "#3b82f6",
    themeColor: "#2563eb",
    role: "Full-Stack Architecture & AI Integration",
    year: "2025",
  },
  {
    num: "02",
    slug: "zihan-uk",
    name: "Zihan.uk Web Platform",
    description: "High-performance digital presence with dynamic theme toggle, typewriter choreography, interactive project gallery, and instant contact channels.",
    stack: ["JavaScript", "HTML5", "CSS3", "Vercel", "Web APIs"],
    repo: "https://github.com/zihanfakir/zihan-uk",
    liveUrl: "https://zihan.uk",
    accent: "#22c55e",
    themeColor: "#16a34a",
    role: "Design & Frontend Engineering",
    year: "2025",
  },
  {
    num: "03",
    slug: "alokpo-search",
    name: "Alokpo Search & Indexer",
    description: "High-speed search engine pipeline providing real-time query parsing, document tokenization, and lightning-fast retrieval metrics.",
    stack: ["Python", "Node.js", "Express", "RESTful API"],
    repo: "https://github.com/zihanfakir/alokpo-search",
    accent: "#f59e0b",
    themeColor: "#d97706",
    role: "Backend & Search Algorithms",
    year: "2024",
  },
  {
    num: "04",
    slug: "ecomace",
    name: "Ecomace Store Engine",
    description: "Modular e-commerce infrastructure supporting complex product catalogs, live inventory tracking, cart state machines, and payment pipelines.",
    stack: ["React", "Next.js", "Tailwind CSS", "MongoDB Atlas"],
    repo: "https://github.com/zihanfakir/Ecomace",
    accent: "#8b5cf6",
    themeColor: "#7c3aed",
    role: "Full-Stack Development",
    year: "2024",
  },
  {
    num: "05",
    slug: "chayapata",
    name: "Chayapata Portal",
    description: "Content distribution and blogging platform with fluid layouts, dark aesthetics, and optimized server-side rendering.",
    stack: ["Next.js", "Tailwind CSS", "Vercel"],
    repo: "https://github.com/zihanfakir/chayapata.pro.bd",
    liveUrl: "https://chayapata.pro.bd",
    accent: "#ec4899",
    themeColor: "#db2777",
    role: "Full-Stack Developer",
    year: "2024",
  },
  {
    num: "06",
    slug: "game-uid-tool",
    name: "Game UID Intelligence",
    description: "Security and session analysis toolkit for player authentication records, UID format validation, and automated network benchmarks.",
    stack: ["Python", "C++", "Automation Scripts"],
    repo: "https://github.com/zihanfakir/Game-UID-crack-by-Zihan",
    accent: "#06b6d4",
    themeColor: "#0891b2",
    role: "Systems & Scripting",
    year: "2023",
  },
];
