export interface ProfileData {
  hero: {
    name: string;
    eyebrow: string;
    tagline: {
      primary: string;
      secondary: string;
    };
    ctaLabel: string;
    hud: {
      locationLabel: string;
      timeZone: string;
      statusWords: string[];
      codingSinceYear: string;
    };
  };
  about: {
    heading: Array<{ text: string; accent?: boolean }[]>;
    bio: string;
    skillsEyebrow: string;
    skills: Array<{
      label: string;
      items: string[];
    }>;
    education: Array<{
      degree: string;
      institution: string;
      period: string;
      detail: string;
    }>;
  };
  career: {
    eyebrow: string;
    items: Array<{
      company: string;
      title: string;
      description: string;
      period: string;
      side: "left" | "right";
    }>;
  };
  footer: {
    eyebrow: string;
    note: string;
    email: string;
    phone: string;
    tags: string[];
    copyLabel: string;
    copiedLabel: string;
    signoff: [string, string];
    socialLinks: Array<{
      label: string;
      href: string;
      username: string;
    }>;
  };
}

export const PROFILE: ProfileData = {
  hero: {
    name: "Zihan Fakir",
    eyebrow: "/ Full-Stack Developer",
    tagline: {
      primary: "Building quietly",
      secondary: "from Dhaka, BD",
    },
    ctaLabel: "Get in touch",
    hud: {
      locationLabel: "Dhaka / GMT+6",
      timeZone: "Asia/Dhaka",
      statusWords: ["BUILDING", "LEARNING", "SHIPPING", "CODING"],
      codingSinceYear: "2023",
    },
  },
  about: {
    heading: [
      [{ text: "A full-stack dev", accent: false }],
      [
        { text: "fueled by " },
        { text: "code", accent: true },
        { text: " & " },
        { text: "craft", accent: true },
      ],
    ],
    bio: "Full-stack developer and software engineer based in Dhaka, Bangladesh. I craft lightning-fast web applications, scalable architectures, and interactive 3D digital experiences. Specializing in TypeScript, Next.js, Node.js, and modern cloud ecosystems — always building, always learning, always shipping.",
    skillsEyebrow: "— Skills & Technologies",
    skills: [
      {
        label: "Frontend",
        items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Three.js", "GSAP"],
      },
      {
        label: "Languages",
        items: ["TypeScript", "JavaScript", "Python", "C++", "HTML5/CSS3"],
      },
      {
        label: "Backend",
        items: ["Node.js", "Express", "RESTful APIs", "FastAPI", "GraphQL"],
      },
      {
        label: "Database",
        items: ["MongoDB", "PostgreSQL", "Firebase", "Supabase", "Redis"],
      },
      {
        label: "Infra & DevOps",
        items: ["Vercel", "Docker", "Git / GitHub", "Linux", "Cloudflare"],
      },
      {
        label: "Tools & Design",
        items: ["VS Code", "Figma", "Postman", "Terminal", "Turbopack"],
      },
    ],
    education: [
      {
        degree: "BSc in Computer Science & Engineering",
        institution: "Leading Academic Program",
        period: "2023 - Present",
        detail:
          "Concentrating in software engineering, distributed systems, algorithms, and computational theory with a passion for web engineering.",
      },
      {
        degree: "Higher Secondary Certificate (HSC), Science",
        institution: "Science College",
        period: "2021 - 2023",
        detail:
          "Graduated with Distinction in Science, building core analytical strengths in higher mathematics, physics, and computer applications.",
      },
    ],
  },
  career: {
    eyebrow: "— Career Trajectory",
    items: [
      {
        company: "Autonomous Engineering",
        title: "Lead Full-Stack Developer",
        description:
          "Architecting responsive web apps, multi-model AI workflows, and high-performance frontend interfaces.",
        period: "2024 — Present",
        side: "right",
      },
      {
        company: "zihan.uk & AI Hub",
        title: "Founder & System Architect",
        description:
          "Launched ai.zihan.xyz supporting 11 multi-model AI engines, user auth, and real-time streaming interfaces.",
        period: "2024 — 2025",
        side: "left",
      },
      {
        company: "Web Craft & Open Source",
        title: "Frontend & UI/UX Developer",
        description:
          "Created modular component systems, interactive landing experiences, and client web portals.",
        period: "2023 — 2024",
        side: "right",
      },
      {
        company: "Freelance",
        title: "Full-Stack Web Specialist",
        description:
          "Delivered end-to-end web solutions, custom dashboards, SEO optimization, and database schemas.",
        period: "2022 — 2023",
        side: "left",
      },
    ],
  },
  footer: {
    eyebrow: "— Get in touch",
    note: "Now accepting new opportunities & collaborations",
    email: "zihanfakir@gmail.com",
    phone: "+880 1402-963123",
    tags: [
      "Tell me what you're building",
      "Remote-friendly",
      "Replies within 24 hours",
      "Timezone: Dhaka (GMT+6)",
      "Open to collaborations",
    ],
    copyLabel: "Copy email",
    copiedLabel: "Copied ✓",
    signoff: ["Zihan Fakir", "Full-Stack Dev"],
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com/zihanfakir",
        username: "@zihanfakir",
      },
      {
        label: "LinkedIn",
        href: "https://linkedin.com/in/zihanfakir",
        username: "zihanfakir",
      },
      {
        label: "Twitter / X",
        href: "https://x.com/ZihanFakir",
        username: "@ZihanFakir",
      },
      {
        label: "Telegram",
        href: "https://t.me/zihanfakir",
        username: "@zihanfakir",
      },
      {
        label: "Portfolio",
        href: "https://zihan.uk",
        username: "zihan.uk",
      },
    ],
  },
};
