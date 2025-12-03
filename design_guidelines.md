# BMT University Design Guidelines

## Design Approach

**Hybrid Approach**: Custom-branded educational platform combining Material Design's structure with crypto-native aesthetics. Drawing inspiration from Coinbase Learn (credible education), Discord (community-driven), and Duolingo (gamified learning), while maintaining BMT's playful meme coin personality and Kaspa's cutting-edge technology aesthetic.

## Core Design Principles

1. **Playful Credibility**: Balance meme coin energy with educational legitimacy
2. **Neon Tech Aesthetic**: Dark backgrounds with vibrant cyan and neon green accents
3. **Comic Book Energy**: Bold, cartoonish elements with dramatic contrasts
4. **Blockchain Transparency**: Visual representation of on-chain data and activity

---

## Typography

**Primary Font**: 'Space Grotesk' (Google Fonts) - Modern, geometric, tech-forward
**Secondary Font**: 'Inter' (Google Fonts) - Clean readability for body content

**Hierarchy**:
- H1 (Hero/Page Titles): Space Grotesk, 48-64px, Bold (700), tracking tight
- H2 (Section Headers): Space Grotesk, 32-40px, SemiBold (600)
- H3 (Card Headers): Space Grotesk, 24-28px, Medium (500)
- Body: Inter, 16px, Regular (400), line-height 1.6
- Small/Meta: Inter, 14px, Regular (400)
- Button Text: Space Grotesk, 16px, SemiBold (600), uppercase

---

## Color Palette

**Primary Colors**:
- Kaspa Cyan: `#00D4FF` (main brand, links, primary CTAs)
- BMT Orange: `#FFB84D` (tears accent, secondary CTAs, highlights)
- Kaspa Green: `#00FF88` (success states, live indicators, energy accents)

**Neutrals**:
- Background Dark: `#0A0E1A` (main background)
- Surface Dark: `#141824` (cards, panels)
- Surface Elevated: `#1E2332` (elevated cards, modals)
- Border: `#2A2F45` (dividers, outlines)
- Text Primary: `#FFFFFF` (headings, primary text)
- Text Secondary: `#A0A8C0` (body text, descriptions)
- Text Muted: `#6B7385` (metadata, timestamps)

**Semantic**:
- Success: `#00FF88` (quiz pass, completion)
- Warning: `#FFB84D` (alerts, pending)
- Error: `#FF4757` (quiz fail, errors)
- Info: `#00D4FF` (notifications, badges)

---

## Layout System

**Spacing Scale**: Tailwind units of **4, 6, 8, 12, 16, 24** for consistent rhythm
- Tight spacing: p-4, gap-4 (within components)
- Standard spacing: p-6, p-8, gap-6 (between elements)
- Section padding: py-12, py-16 (mobile), py-20, py-24 (desktop)
- Large spacing: mb-16, mb-24 (major section breaks)

**Grid System**:
- Max width: `max-w-7xl` for full-page content
- Course cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dashboard panels: `grid-cols-1 lg:grid-cols-2` or `lg:grid-cols-3`
- Always single column on mobile, expand on tablet/desktop

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Sticky dark header (bg-[#0A0E1A]/90 backdrop-blur)
- BMT logo (jar character) left aligned
- Wallet connect button right aligned with neon cyan outline
- User dropdown showing wallet address (truncated)
- Navigation links: Home, Courses, Dashboard, Analytics

### Hero Section (Homepage)
**Animated Kaspa Blockdag Background**:
- Full viewport height (min-h-screen)
- Animated cyan particle network flowing across dark background
- Semi-transparent overlay gradient (from-[#0A0E1A]/80 to-transparent)
- Centered content with BMT jar logo (200px height)
- Large headline: "BMT UNIVERSITY" in Space Grotesk
- Subheadline: "Learn. Earn. Collect Tears."
- Primary CTA: "Connect Wallet" (cyan gradient, backdrop-blur)
- Live metrics ticker below: Total students, Courses, $BMT distributed

### Course Cards
- Dark surface background (#141824) with subtle cyan border on hover
- Course thumbnail placeholder (16:9 ratio) with category badge overlay
- BMT jar mascot icon for project branding
- Title (H3), instructor name, duration estimate
- Progress bar (if enrolled) - cyan gradient fill
- Price in $BMT tokens with orange accent
- Difficulty badge (Beginner/Intermediate/Advanced) in neon green

### Dashboards
**Student Dashboard**:
- Grid layout with metric cards (enrolled courses, completion rate, $BMT earned)
- Each card: dark surface, neon cyan border top, icon with glow effect
- "My Courses" section with horizontal scroll cards
- Recent activity feed with blockchain transaction links

**Analytics Dashboard** (Creator/Admin):
- Multi-column stats panels
- Line charts with cyan/green gradients for on-chain payout trends
- Student progress heatmap
- Top performing courses leaderboard
- Live Kasplex feed widget (scrolling transactions)

### Quiz Interface
- Question card: elevated surface (#1E2332) with question number badge
- Multiple choice options as large clickable cards with hover states
- Selected state: cyan border glow
- Submit button: orange gradient with BMT jar icon
- Results screen: Full screen overlay with confetti animation (pass) or retry prompt (fail)
- Score display: Large percentage with neon green (pass) or orange (retry) color

### Forms & Inputs
- Dark inputs with subtle cyan underline (not outline)
- Floating labels on focus
- File upload: Dashed border dropzone with BMT jar "tear drop" animation on hover
- Quiz builder: Drag-and-drop question ordering with neon green reorder handles

### Buttons
**Primary CTA**: Cyan-to-green gradient, uppercase Space Grotesk, px-8 py-3, rounded-lg
**Secondary**: Orange outline, transparent background, same padding
**Ghost**: Text only with cyan color, underline on hover
**Wallet Connect**: Special treatment with MetaMask/WalletConnect icons, blurred background when on images

### Certificates
- Full-page modal with dark border frame
- BMT University header with jar logo
- Kaspa blockdag subtle background pattern
- Student name, course title, completion date
- On-chain verification hash displayed at bottom
- Download button and share to social

---

## Animations

**Use Sparingly**:
- Kaspa blockdag background: Slow flowing particle animation (CSS/canvas)
- Card hover: Subtle lift (translateY -2px) and cyan glow
- Button interactions: Gradient shift on hover
- Page transitions: Fade in content sections (200ms)
- Quiz submit: Loading spinner with cyan color
- Certificate appearance: Slide up with scale animation
- NO scroll-triggered animations except gentle fade-ins

---

## Images

**Hero Section**:
- Animated Kaspa blockdag visualizer as full-screen background (referenced from provided assets)
- BMT jar logo prominently displayed (200-250px)

**About $BMT Section**:
- BMT meme collage (3-4 meme images in a grid showing different jar characters)
- Token logo featured alongside live metrics

**Course Thumbnails**:
- Placeholder images for each course (crypto/blockchain themed stock photos)
- Category badges overlaid on top-right

**Dashboard**:
- BMT jar mascot variations as section icons
- Kaspa green lightning bolt for achievement badges

**Throughout UI**:
- BMT jar character as loading indicator
- Small jar icons for $BMT token amounts
- Kaspa green energy accents as decorative elements

All buttons on images use backdrop-blur backgrounds for readability.