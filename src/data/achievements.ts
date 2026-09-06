export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  category: "Hackathons" | "Research" | "Volunteering" | "Courses";
  year: string;
  description?: string;
  link?: string;
}

export const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "01",
    title: "National Tech Hackathon Contender",
    issuer: "Bangladesh Innovation Summit",
    category: "Hackathons",
    year: "2025",
    description: "Built an autonomous emergency response dispatch pipeline within 36 hours.",
  },
  {
    id: "02",
    title: "Full-Stack Software Architecture Certification",
    issuer: "Global Software Engineering Institute",
    category: "Courses",
    year: "2024",
    description: "Advanced mastery in distributed systems, asynchronous event queues, and reactive state management.",
  },
  {
    id: "03",
    title: "AI & Neural Networks Specialist Track",
    issuer: "DeepLearning AI & Coursera",
    category: "Courses",
    year: "2024",
    description: "Comprehensive study of transformer architectures, attention mechanisms, and LLM fine-tuning.",
  },
  {
    id: "04",
    title: "Youth Tech Community Lead",
    issuer: "Open Tech Bangladesh Network",
    category: "Volunteering",
    year: "2023 - 2024",
    description: "Mentored aspiring developers in Git, open-source collaboration, and modern web frameworks.",
  },
  {
    id: "05",
    title: "Computational Systems & Data Optimization",
    issuer: "Academic Symposium",
    category: "Research",
    year: "2024",
    description: "Authored technical analysis on indexing efficiencies in relational vs document-oriented datastores.",
  },
  {
    id: "06",
    title: "Algorithmic Problem Solving & Competitive Coding",
    issuer: "Programming Society",
    category: "Hackathons",
    year: "2023",
    description: "Secured top standing in regional speed programming and algorithmic puzzle tournaments.",
  },
];
