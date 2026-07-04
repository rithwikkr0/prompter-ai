import type { Template, PromptCategory } from '../types';

const id = (str: string) => str;

export const DEFAULT_TEMPLATES: Template[] = [
  // ── Coding ──────────────────────────────────────────────────────────────────
  {
    id: id('tpl-coding-1'),
    title: 'Implement a Feature',
    description: 'Professional code implementation with best practices',
    category: 'coding' as PromptCategory,
    prompt: 'You are a senior software engineer. Implement [FEATURE_NAME] in [LANGUAGE/FRAMEWORK]. Requirements:\n- [REQUIREMENT_1]\n- [REQUIREMENT_2]\n\nConstraints:\n- Follow [CODING_STANDARD] conventions\n- Include error handling\n- Write clean, readable code\n- Add inline comments for complex logic\n\nOutput format:\n1. Brief explanation of approach\n2. Complete implementation code\n3. Usage example\n4. Any potential edge cases to handle',
    isCustom: false,
    tags: ['coding', 'implementation', 'engineering'],
  },
  {
    id: id('tpl-coding-2'),
    title: 'Code Review',
    description: 'Thorough code review with actionable feedback',
    category: 'coding' as PromptCategory,
    prompt: 'You are an expert code reviewer. Review the following [LANGUAGE] code:\n\n```\n[PASTE CODE HERE]\n```\n\nEvaluate for:\n1. **Correctness**: Logic errors, edge cases, bugs\n2. **Performance**: Time/space complexity, bottlenecks\n3. **Security**: Vulnerabilities, input validation\n4. **Readability**: Naming, structure, comments\n5. **Best Practices**: SOLID, DRY, patterns\n\nFormat your response as:\n- **Critical Issues** (must fix)\n- **Suggestions** (should fix)\n- **Improvements** (nice to have)\n- **Positives** (what was done well)',
    isCustom: false,
    tags: ['coding', 'review', 'quality'],
  },
  // ── Debugging ───────────────────────────────────────────────────────────────
  {
    id: id('tpl-debug-1'),
    title: 'Debug an Error',
    description: 'Systematic debugging with root cause analysis',
    category: 'debugging' as PromptCategory,
    prompt: 'You are an expert debugger. Help me fix this error in my [LANGUAGE] code.\n\n**Error Message:**\n```\n[PASTE ERROR HERE]\n```\n\n**Code Context:**\n```\n[PASTE RELEVANT CODE]\n```\n\n**What I expected:** [DESCRIBE EXPECTED BEHAVIOR]\n**What happened:** [DESCRIBE ACTUAL BEHAVIOR]\n**What I\'ve tried:** [LIST ATTEMPTS]\n\nPlease:\n1. Identify the root cause\n2. Explain why this error occurs\n3. Provide a fix with explanation\n4. Suggest how to prevent this in the future',
    isCustom: false,
    tags: ['debugging', 'error', 'fix'],
  },
  // ── Research ─────────────────────────────────────────────────────────────────
  {
    id: id('tpl-research-1'),
    title: 'Literature Review',
    description: 'Structured academic literature analysis',
    category: 'research' as PromptCategory,
    prompt: 'You are an expert research assistant with deep knowledge in [RESEARCH_FIELD]. Conduct a comprehensive literature review on: **[TOPIC]**\n\nScope:\n- Time period: [DATE_RANGE, e.g., 2018-2024]\n- Audience: [TARGET_AUDIENCE]\n- Depth: [OVERVIEW/COMPREHENSIVE]\n\nStructure your response:\n1. **Overview** (2-3 paragraphs)\n2. **Key Themes & Findings** (bullet points)\n3. **Major Contributors & Works**\n4. **Current Debates & Gaps**\n5. **Research Directions**\n6. **Suggested References** (cite properly)\n\nUse academic tone. Cite key papers where relevant.',
    isCustom: false,
    tags: ['research', 'academic', 'literature'],
  },
  // ── Writing ──────────────────────────────────────────────────────────────────
  {
    id: id('tpl-writing-1'),
    title: 'Blog Post',
    description: 'SEO-optimized, engaging blog article',
    category: 'writing' as PromptCategory,
    prompt: 'You are a professional content writer and SEO specialist. Write a compelling blog post about: **[TOPIC]**\n\nSpecifications:\n- Target audience: [AUDIENCE]\n- Tone: [professional/casual/educational]\n- Word count: [TARGET_WORDS]\n- Primary keyword: [KEYWORD]\n- Call to action: [DESIRED_ACTION]\n\nStructure:\n1. Hook headline (with power word)\n2. Engaging introduction (problem/hook)\n3. 4-6 structured sections with H2/H3 headers\n4. Practical tips or examples\n5. Strong conclusion with CTA\n\nInclude: meta description (150 chars), suggested internal links, FAQ section.',
    isCustom: false,
    tags: ['writing', 'blog', 'content', 'seo'],
  },
  // ── Email ─────────────────────────────────────────────────────────────────────
  {
    id: id('tpl-email-1'),
    title: 'Professional Email',
    description: 'Clear, professional email for any business context',
    category: 'email' as PromptCategory,
    prompt: 'You are a professional business communication expert. Write a [FORMAL/SEMI-FORMAL] email for the following situation:\n\n**Context:** [DESCRIBE SITUATION]\n**Sender:** [YOUR ROLE/NAME]\n**Recipient:** [RECIPIENT ROLE/NAME]\n**Goal:** [WHAT YOU WANT TO ACHIEVE]\n**Tone:** [professional/friendly/urgent/persuasive]\n**Key points to cover:**\n- [POINT 1]\n- [POINT 2]\n\nRequirements:\n- Subject line (compelling, under 50 chars)\n- Professional greeting\n- Clear body (3-4 short paragraphs)\n- Specific call to action\n- Professional sign-off\n\nKeep it concise and scannable.',
    isCustom: false,
    tags: ['email', 'business', 'communication'],
  },
  // ── Image Generation ──────────────────────────────────────────────────────────
  {
    id: id('tpl-image-1'),
    title: 'Image Generation Prompt',
    description: 'Detailed prompt for AI image generators',
    category: 'image-generation' as PromptCategory,
    prompt: 'Create a [STYLE: photorealistic/digital art/illustration/oil painting] image of [MAIN_SUBJECT].\n\n**Scene Details:**\n- Setting: [LOCATION/ENVIRONMENT]\n- Time of day: [MORNING/GOLDEN HOUR/NIGHT]\n- Weather/Mood: [MOOD]\n\n**Visual Style:**\n- Art style: [REFERENCE_ARTIST_OR_STYLE]\n- Color palette: [WARM/COOL/VIBRANT/MUTED]\n- Lighting: [SOFT/DRAMATIC/NATURAL/STUDIO]\n\n**Technical:**\n- Camera: [ANGLE: eye-level/bird\'s eye/close-up]\n- Lens: [WIDE/TELEPHOTO/MACRO]\n- Quality: 8K, ultra-detailed, hyperrealistic\n- Negative: blurry, distorted, low quality, watermark',
    isCustom: false,
    tags: ['image', 'ai-art', 'midjourney', 'dalle'],
  },
  // ── Marketing ─────────────────────────────────────────────────────────────────
  {
    id: id('tpl-marketing-1'),
    title: 'Ad Copy',
    description: 'High-converting advertising copy',
    category: 'marketing' as PromptCategory,
    prompt: 'You are a world-class copywriter with expertise in direct-response marketing. Write [AD_TYPE: Facebook ad/Google ad/landing page copy] for:\n\n**Product/Service:** [PRODUCT]\n**Target Audience:** [AUDIENCE: age, interests, pain points]\n**Unique Value Proposition:** [WHAT MAKES IT SPECIAL]\n**Desired Action:** [CTA: buy now/sign up/learn more]\n**Budget/Offer:** [PRICE or DISCOUNT if applicable]\n\nUsing frameworks:\n- Hook (grab attention in 3 seconds)\n- AIDA (Attention, Interest, Desire, Action)\n- Social proof elements\n- Urgency/scarcity if appropriate\n\nWrite 3 variations (short/medium/long) with different angles.',
    isCustom: false,
    tags: ['marketing', 'advertising', 'copywriting', 'conversion'],
  },
  // ── Resume ─────────────────────────────────────────────────────────────────────
  {
    id: id('tpl-resume-1'),
    title: 'Resume Summary',
    description: 'Compelling professional summary for resumes',
    category: 'resume' as PromptCategory,
    prompt: 'You are a professional resume writer and career coach. Write a compelling resume summary for:\n\n**Role Applying For:** [TARGET_ROLE]\n**Years of Experience:** [YEARS]\n**Key Skills:** [SKILL_1, SKILL_2, SKILL_3]\n**Notable Achievement:** [TOP_ACHIEVEMENT]\n**Industry:** [INDUSTRY]\n**Career Goal:** [WHAT YOU WANT TO ACHIEVE]\n\nRequirements:\n- 3-4 sentences maximum\n- Lead with years of experience and specialty\n- Include 2-3 quantifiable achievements\n- End with what you bring to the employer\n- ATS-friendly keywords for [INDUSTRY]\n- Active voice, strong action verbs\n- NO first-person pronouns (I, me, my)',
    isCustom: false,
    tags: ['resume', 'career', 'job-search'],
  },
  // ── Business ──────────────────────────────────────────────────────────────────
  {
    id: id('tpl-business-1'),
    title: 'Business Plan Executive Summary',
    description: 'Investor-ready executive summary',
    category: 'business' as PromptCategory,
    prompt: 'You are a McKinsey-level business consultant and startup advisor. Write an executive summary for a business plan:\n\n**Company:** [COMPANY_NAME]\n**Industry:** [INDUSTRY]\n**Product/Service:** [WHAT YOU DO]\n**Problem Solved:** [PAIN POINT]\n**Target Market:** [WHO YOU SERVE]\n**Revenue Model:** [HOW YOU MAKE MONEY]\n**Stage:** [IDEA/SEED/SERIES A]\n**Funding Ask:** [AMOUNT if applicable]\n\nCover:\n1. Company overview (2 sentences)\n2. Problem & solution\n3. Market opportunity (TAM/SAM/SOM)\n4. Business model\n5. Traction & milestones\n6. Team highlights\n7. Financial projections (3-year)\n8. The ask\n\nTone: Confident, data-driven, investor-ready. 1 page maximum.',
    isCustom: false,
    tags: ['business', 'startup', 'investor', 'pitch'],
  },
  // ── Academic ──────────────────────────────────────────────────────────────────
  {
    id: id('tpl-academic-1'),
    title: 'Essay Outline',
    description: 'Structured academic essay framework',
    category: 'academic-writing' as PromptCategory,
    prompt: 'You are an academic writing tutor at a top university. Create a detailed essay outline for:\n\n**Topic:** [ESSAY_TOPIC]\n**Assignment Type:** [ARGUMENTATIVE/ANALYTICAL/EXPOSITORY/COMPARATIVE]\n**Word Count:** [TARGET_LENGTH]\n**Academic Level:** [HIGH SCHOOL/UNDERGRADUATE/GRADUATE]\n**Citation Style:** [APA/MLA/CHICAGO]\n**Key Argument/Thesis:** [YOUR_POSITION if known]\n\nProvide:\n1. **Thesis Statement** (clear, arguable, specific)\n2. **Introduction outline** (hook, background, thesis)\n3. **Body paragraphs** (3-5 sections with topic sentences, evidence, analysis)\n4. **Counterargument & Rebuttal section**\n5. **Conclusion outline**\n6. **Suggested sources** (types, not titles)\n7. **Transition phrases** to use between sections',
    isCustom: false,
    tags: ['academic', 'essay', 'writing', 'education'],
  },
  // ── Data Science ─────────────────────────────────────────────────────────────
  {
    id: id('tpl-ds-1'),
    title: 'Data Analysis Request',
    description: 'Structured data analysis with insights',
    category: 'data-science' as PromptCategory,
    prompt: 'You are a senior data scientist. Analyze the following dataset and provide insights:\n\n**Dataset Description:** [DESCRIBE YOUR DATA]\n**Data Format:** [CSV/JSON/SQL table]\n**Business Question:** [WHAT DO YOU WANT TO KNOW]\n**Key Variables:** [LIST IMPORTANT COLUMNS]\n**Known Issues:** [MISSING DATA/OUTLIERS etc.]\n\nProvide:\n1. **Exploratory Analysis** (distributions, correlations)\n2. **Key Findings** (top 5 insights with data)\n3. **Visualizations** (describe the charts to create)\n4. **Statistical Tests** if applicable\n5. **Actionable Recommendations** based on data\n6. **Python/R Code** to reproduce the analysis\n\nFocus on business value, not just statistics.',
    isCustom: false,
    tags: ['data-science', 'analysis', 'python', 'statistics'],
  },
];
