'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  HardHat, MapPin, ArrowRight, ChevronRight, ChevronLeft, ChevronDown, Menu, X, Star, Quote,
  Home as HomeIcon, Wrench, Layers, ShieldCheck, Construction, ClipboardCheck,
  Mail, Phone, Building2, Images, Globe2, Award, Users,
  PhoneCall, FileSpreadsheet, KeyRound,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

// ── Nav ───────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '#about',     label: 'About' },
    { href: '#services',  label: 'Services' },
    { href: '#work',      label: 'Our Work' },
    { href: '#reviews',   label: 'Reviews' },
  ];

  return (
    <header
      className="sticky top-4 z-50 w-[94%] max-w-7xl mx-auto border border-border/25 bg-card/70 backdrop-blur-xl rounded-2xl shadow-surface mt-4"
      role="banner"
    >
      <div className="flex h-16 items-center justify-between px-5 md:px-7">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="IN Builders — home">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shadow-surface flex-shrink-0" aria-hidden>
            <Image src="/images/logo.png" alt="" fill className="object-contain p-0.5" sizes="40px" />
          </div>
          <span className="font-bold text-[16px] tracking-tight text-foreground/90">IN Builders</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-muted-foreground/75" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </nav>

        {/* CTA + mobile */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-foreground text-background text-[12.5px] font-bold rounded-xl hover:brightness-110 transition-all shadow-surface"
          >
            Team Login
            <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-4 h-4" aria-hidden /> : <Menu className="w-4 h-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/15 px-5 py-4 space-y-3 bg-card/95 rounded-b-2xl">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-[14px] font-semibold text-muted-foreground/75 hover:text-foreground transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

// ── Data ──────────────────────────────────────────────────────

const SERVICES = [
  { icon: HomeIcon,     title: 'Residential Construction',     description: 'New home builds from foundation to roof, tailored to your land, budget, and timeline.',            accent: 'bg-info-subtle text-info' },
  { icon: Wrench,       title: 'Renovations & Interior Fit-Outs', description: 'Kitchen upgrades, interior remodels, and commercial fit-outs finished to a high standard.',       accent: 'bg-success-subtle text-success' },
  { icon: Layers,       title: 'Roofing & Structural Work',     description: 'Roof framing, re-roofing, and structural repairs built to hold up through the monsoon.',           accent: 'bg-warning-subtle text-warning' },
  { icon: ShieldCheck,  title: 'Boundary Walls & Gatehouses',   description: 'Perimeter walls, security gates, and guardhouses for homes, estates, and factories.',              accent: 'bg-danger-subtle text-danger' },
  { icon: Construction, title: 'Concrete & Driveways',          description: 'Access roads, driveways, and drainage channels finished to a smooth, durable pour.',              accent: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)]' },
  { icon: ClipboardCheck, title: 'Site Supervision',            description: 'Dedicated on-site oversight from groundbreaking through to final handover, island-wide.',           accent: 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]' },
];

function imgs(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `/images/projects/${prefix}-${i + 1}.jpg`);
}

const PROJECTS = [
  {
    title: 'Private Residence — Full Construction',
    location: 'Gelioya, Kandy District',
    description: 'Ground-up construction of a family home — from the groundbreaking ceremony through foundation, column casting, and roof framing.',
    tags: ['Foundation', 'Structural Framing', 'Roofing'],
    images: imgs('villa', 15),
  },
  {
    title: 'Home Renovation & Kitchen Rebuild',
    location: 'Gampola, Kandy District',
    description: 'Full interior renovation of an older residence, including a complete modern kitchen rebuild with granite countertops and tiling.',
    tags: ['Renovation', 'Kitchen Fit-Out', 'Tiling'],
    images: imgs('residence', 10),
  },
  {
    title: 'Community School Building',
    location: 'Hanguranketa, Kandy District',
    description: 'Roof restoration and wall repairs for a rural school building, completed ahead of the school term.',
    tags: ['Roofing', 'Wall Repairs'],
    images: imgs('school', 9),
  },
  {
    title: 'Factory Perimeter Wall & Gatehouse',
    location: 'Biyagama Industrial Zone',
    description: 'Boundary wall construction and a new security gatehouse for a commercial facility.',
    tags: ['Boundary Wall', 'Gatehouse', 'Commercial'],
    images: imgs('factory', 8),
  },
  {
    title: 'Bookshop Interior Fit-Out',
    location: 'Kandy City',
    description: 'Steel ceiling grid and shelving installation for a busy retail bookstore, completed with minimal disruption to trading.',
    tags: ['Interior Fit-Out', 'Commercial'],
    images: imgs('bookhouse', 5),
  },
  {
    title: 'Estate Access Road & Drainage',
    location: 'Katugastota, Kandy District',
    description: 'Concrete paving and drainage channel works for a private access road.',
    tags: ['Concrete', 'Drainage'],
    images: imgs('road', 5),
  },
];

const REVIEWS = [
  { name: 'Nimal Perera',            location: 'Gelioya',      rating: 5, quote: 'IN Builders built our house from the ground up. They were on site every day and kept us updated at every stage. Couldn’t be happier with the result.' },
  { name: 'Chamari Wickramasinghe',  location: 'Gampola',      rating: 5, quote: 'Our kitchen renovation looks incredible. The team was clean, punctual, and the finish is exactly what we asked for.' },
  { name: 'Ruwan Bandara',           location: 'Biyagama',     rating: 5, quote: 'We hired IN Builders for our factory boundary wall and gatehouse. Professional crew, good safety practices, finished on schedule.' },
  { name: 'Malini Fernando',         location: 'Kandy',        rating: 4, quote: 'They fitted out our bookshop’s ceiling and shelving fast so we barely lost any trading time. Very tidy work.' },
  { name: 'Sunil Rathnayake',        location: 'Hanguranketa', rating: 5, quote: 'Re-roofed our school building before the monsoon. Fair pricing and honest communication throughout.' },
  { name: 'Priyantha Jayasuriya',    location: 'Katugastota',  rating: 5, quote: 'Solid concrete work on our access road — no cracks, proper drainage, still holding up years later.' },
];

const WHY_US = [
  { icon: Globe2, title: 'Island-wide reach',     description: 'Based in the Kandy District, taking on jobs across Sri Lanka.' },
  { icon: Award,  title: 'Standards we sign off',  description: 'Every job site-supervised — nothing subcontracted out of sight.' },
  { icon: Users,  title: 'One accountable crew',   description: 'The same team from groundbreaking to handover, every time.' },
];

const PROCESS = [
  { step: '01', icon: PhoneCall,       title: 'Site visit & consultation', description: 'We walk the site with you, talk through what you need, and understand the land, access, and budget before anything is priced.' },
  { step: '02', icon: FileSpreadsheet, title: 'Quotation & planning',      description: 'A clear, itemised quote — materials, labour, and timeline — so there are no surprises once work starts.' },
  { step: '03', icon: HardHat,         title: 'Construction & supervision', description: 'Work begins on the agreed schedule, with the same crew on site every day and progress you can check in on.' },
  { step: '04', icon: KeyRound,        title: 'Handover & support',        description: 'A final walkthrough before handover, and we stay reachable after the job is done — not gone the day the invoice is paid.' },
];

const FAQS = [
  { q: 'Do you supply materials, or just labour?', a: 'Both. We source and supply materials as part of the job, or work with materials you’ve already bought — whichever suits your budget and preferences.' },
  { q: 'Do you only work in the Kandy District?', a: 'Kandy is where we’re based, but we take on projects island-wide. Distance just gets factored into the quotation.' },
  { q: 'How does pricing and quotation work?', a: 'After a site visit, you get an itemised quote covering materials, labour, and an expected timeline — before any work or payment starts.' },
  { q: 'Can I visit the site while work is in progress?', a: 'Yes — every project is site-supervised, and you’re welcome to check in on progress whenever you like.' },
  { q: 'What size of job do you take on?', a: 'Anything from a single boundary wall or interior fit-out to a full house build or commercial site — the crew and timeline scale to the job.' },
  { q: 'What happens after handover?', a: 'We do a final walkthrough with you before handover, and stay reachable afterwards if anything needs following up.' },
];

// ── Small pieces ─────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center select-none">
      <p className="text-[2.5rem] md:text-[3rem] font-semibold text-foreground tracking-tight leading-none tabular-nums">
        {value}
      </p>
      <p className="text-[13px] font-medium text-muted-foreground/60 mt-2">
        {label}
      </p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-warning fill-warning' : 'text-border/40'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

// ── Project gallery modal (grid + full-screen viewer) ─────────

type Project = (typeof PROJECTS)[number];

function ProjectGalleryModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    setViewerIndex(null);
  }, [project]);

  useEffect(() => {
    if (viewerIndex === null || !project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(null);
      if (e.key === 'ArrowRight') setViewerIndex((i) => (i === null ? i : (i + 1) % project.images.length));
      if (e.key === 'ArrowLeft') setViewerIndex((i) => (i === null ? i : (i - 1 + project.images.length) % project.images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, project]);

  if (!project) return null;

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={viewerIndex === null}
        className="max-w-4xl w-full max-h-[88vh] p-0 gap-0 overflow-hidden rounded-3xl"
      >
        {viewerIndex === null ? (
          <div className="flex flex-col max-h-[88vh]">
            <DialogHeader className="p-6 pb-4 border-b border-border/15 flex-shrink-0">
              <DialogTitle className="text-[20px] font-bold text-foreground/90">{project.title}</DialogTitle>
              <DialogDescription>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground/70">
                  <MapPin className="w-3.5 h-3.5" aria-hidden />
                  {project.location}
                </span>
                <span className="block mt-2 text-[13.5px] text-muted-foreground/70">{project.description}</span>
                <span className="flex flex-wrap gap-1.5 mt-3">
                  {project.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-accent/50 border border-border/25 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground/75">
                      {t}
                    </span>
                  ))}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 stagger-children">
                {project.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setViewerIndex(i)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border/20 group focus:outline-none focus:ring-2 focus:ring-ring/40"
                    aria-label={`View photo ${i + 1} of ${project.images.length}`}
                  >
                    <Image src={img} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="220px" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[88vh] bg-black flex items-center justify-center">
            <button
              onClick={() => setViewerIndex(null)}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close photo viewer"
            >
              <X className="w-4.5 h-4.5" aria-hidden />
            </button>
            <button
              onClick={() => setViewerIndex((i) => (i! - 1 + project.images.length) % project.images.length)}
              className="absolute left-3 sm:left-5 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <div className="relative w-full h-full">
              <Image
                key={project.images[viewerIndex]}
                src={project.images[viewerIndex]}
                alt={`${project.title} — photo ${viewerIndex + 1}`}
                fill
                className="object-contain animate-fade-in"
                sizes="100vw"
              />
            </div>
            <button
              onClick={() => setViewerIndex((i) => (i! + 1) % project.images.length)}
              className="absolute right-3 sm:right-5 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-[12px] font-semibold tabular-nums">
              {viewerIndex + 1} / {project.images.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main landing page ─────────────────────────────────────────

export default function LandingPage() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-foreground selection:text-background">
      {/* Background grid */}
      <div className="fixed inset-0 structural-grid pointer-events-none -z-10" aria-hidden />
      <div className="fixed top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-primary/6 blur-[160px] pointer-events-none -z-10" aria-hidden />
      <div className="fixed bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-success/5 blur-[130px] pointer-events-none -z-10" aria-hidden />

      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-16 pb-0 max-w-7xl mx-auto w-full" aria-label="Hero">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-accent/40 backdrop-blur-sm px-4 py-1.5 mb-7 select-none">
          <Globe2 className="w-3.5 h-3.5 text-muted-foreground/70" aria-hidden />
          <span className="text-[12px] font-medium text-foreground/75">
            Construction &amp; building contractors — serving all of Sri Lanka
          </span>
        </div>

        <h1 className="text-[2.75rem] md:text-[4rem] xl:text-[4.75rem] font-semibold tracking-[-0.04em] leading-[1.05] text-foreground/95 max-w-4xl mx-auto mb-6">
          From foundation to finish,{' '}
          <span className="text-muted-foreground">we build it right.</span>
        </h1>

        <p className="text-[16px] text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium mb-9">
          IN Builders is a Sri Lankan construction company delivering homes, renovations,
          roofing, boundary walls, and commercial fit-outs — island-wide, built on site,
          on schedule, and done properly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-14">
          <a
            href="#work"
            className="inline-flex items-center gap-2.5 h-12 px-7 bg-foreground text-background text-[15px] font-bold rounded-2xl hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-elevated"
          >
            See our work
            <ArrowRight className="w-4.5 h-4.5" aria-hidden />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 h-12 px-7 border border-border/30 bg-card/60 text-foreground/80 text-[15px] font-semibold rounded-2xl hover:bg-accent/50 hover:border-border/50 transition-all duration-200 backdrop-blur-sm"
          >
            Get in touch
          </a>
        </div>

        {/* Hero image */}
        <div className="relative w-full max-w-6xl rounded-3xl overflow-hidden shadow-elevated border border-border/25">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/8]">
            <Image
              src="/images/hero-roofing.jpg"
              alt="Roof framing under construction on a residential build"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1280px) 1152px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/5 to-transparent" aria-hidden />
          </div>

          {/* Stat strip — stacked below the image on mobile, floating overlay from sm+ */}
          <div className="relative sm:absolute sm:bottom-5 sm:left-5 sm:right-auto flex flex-wrap items-center gap-3 sm:gap-5 bg-card sm:bg-card/80 sm:backdrop-blur-xl border-t sm:border border-border/30 sm:rounded-2xl px-5 py-3.5 sm:shadow-elevated">
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-primary" aria-hidden />
              <span className="text-[13px] font-bold text-foreground/90">52 project photos</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border/40" aria-hidden />
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-success" aria-hidden />
              <span className="text-[13px] font-bold text-foreground/90">Island-wide service</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 border-b border-border/15" aria-label="Company statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <Stat value="6+"     label="Completed projects showcased" />
          <Stat value="100%"   label="Site-supervised builds"       />
          <Stat value="Island" label="Wide service coverage"        />
          <Stat value="1"      label="Crew, start to handover"      />
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-28 w-full max-w-6xl mx-auto px-6 py-24" aria-labelledby="about-heading">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/30 px-4 py-1.5 mb-5 select-none">
              <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden />
              <span className="text-[12px] font-medium text-muted-foreground/75">About IN Builders</span>
            </div>
            <h2 id="about-heading" className="text-[2.25rem] md:text-[2.75rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-5 leading-tight">
              A hands-on building crew, not a call centre.
            </h2>
            <p className="text-[15px] text-muted-foreground/65 leading-relaxed font-medium mb-4">
              IN Builders takes on residential construction, renovations, roofing, boundary walls,
              and commercial fit-outs — based in the Kandy District, and equipped to take on work
              anywhere on the island. Every project is site-supervised from groundbreaking to
              handover — no subcontracted guesswork.
            </p>
            <p className="text-[15px] text-muted-foreground/65 leading-relaxed font-medium mb-7">
              Whether it&apos;s a new family home, a kitchen rebuild, or a factory perimeter wall,
              we plan the job properly, show up on schedule, and finish it to a standard we&apos;d
              put our own name on.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WHY_US.map((w) => (
                <div key={w.title} className="p-4 bg-card border border-border/20 rounded-xl">
                  <w.icon className="w-4 h-4 text-primary mb-2.5" aria-hidden />
                  <p className="text-[12.5px] font-bold text-foreground/90 mb-1">{w.title}</p>
                  <p className="text-[11.5px] text-muted-foreground/60 leading-relaxed">{w.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated border border-border/25">
            <Image
              src="/images/projects/villa-13.jpg"
              alt="Timber roof framing on a residential construction site"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </div>
      </section>

      {/* ── Process / How We Work ─────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-24" aria-labelledby="process-heading">
        <div className="text-center mb-14 select-none">
          <h2 id="process-heading" className="text-[2.25rem] md:text-[2.75rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4 leading-tight">
            How a project runs with us.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto leading-relaxed font-medium">
            Four steps, start to finish — no surprises in between.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {PROCESS.map((p) => (
            <div key={p.step} className="relative bg-card border border-border/25 rounded-2xl p-6 shadow-surface text-left overflow-hidden">
              <div className="text-[40px] font-semibold text-foreground/[0.06] absolute top-3 right-4 select-none tabular-nums" aria-hidden>{p.step}</div>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground text-background mb-4 shadow-surface" aria-hidden>
                <p.icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-[15px] font-bold text-foreground/90 mb-2">{p.title}</h3>
              <p className="text-[13px] text-muted-foreground/65 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────── */}
      <section id="services" className="scroll-mt-28 w-full bg-accent/10 border-y border-border/15 px-6 py-24" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 select-none">
            <h2 id="services-heading" className="text-[2.5rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4 leading-tight">
              What we build.
            </h2>
            <p className="text-[15px] text-muted-foreground/60 max-w-xl mx-auto leading-relaxed font-medium">
              From a single boundary wall to a full house build — one crew, start to finish, anywhere on the island.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {SERVICES.map((s) => (
              <div key={s.title} className="group p-6 bg-card border border-border/25 rounded-2xl shadow-surface hover:shadow-elevated hover:border-border/45 hover:-translate-y-0.5 transition-all duration-300 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${s.accent}`} aria-hidden>
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-bold text-foreground/90 mb-2">{s.title}</h3>
                <p className="text-[13px] text-muted-foreground/65 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio / Our Work ─────────────────────────── */}
      <section id="work" className="scroll-mt-28 w-full max-w-7xl mx-auto px-6 py-24" aria-labelledby="work-heading">
        <div className="text-center mb-14 select-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/30 px-4 py-1.5 mb-5">
            <Layers className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span className="text-[12px] font-medium text-muted-foreground/75">Previous work</span>
          </div>
          <h2 id="work-heading" className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4 leading-tight">
            Projects on the ground.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 max-w-xl mx-auto leading-relaxed font-medium">
            Click any project to browse the full photo set.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {PROJECTS.map((p) => (
            <button
              key={p.title}
              onClick={() => setActiveProject(p)}
              className="group text-left bg-card border border-border/25 rounded-2xl shadow-surface hover:shadow-elevated hover:border-border/45 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 768px) 560px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold">
                  <Images className="w-3.5 h-3.5" aria-hidden />
                  {p.images.length}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white">
                    View all {p.images.length} photos
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-[16px] font-bold text-foreground/90 mb-1.5">{p.title}</h3>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground/60 mb-3">
                  <MapPin className="w-3.5 h-3.5" aria-hidden />
                  {p.location}
                </div>
                <p className="text-[13.5px] text-muted-foreground/65 leading-relaxed mb-3.5">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-accent/50 border border-border/20 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground/70">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────── */}
      <section id="reviews" className="scroll-mt-28 w-full bg-accent/10 border-y border-border/15 px-6 py-24" aria-labelledby="reviews-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 select-none">
            <h2 id="reviews-heading" className="text-[2.5rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4">
              What clients say.
            </h2>
            <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto">
              Feedback from recent homeowners and businesses we&apos;ve built for.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-card border border-border/25 rounded-2xl p-6 shadow-surface hover:shadow-elevated transition-all duration-300 text-left flex flex-col">
                <Quote className="w-5 h-5 text-muted-foreground/25 mb-3" aria-hidden />
                <p className="text-[13.5px] text-foreground/80 leading-relaxed font-medium mb-5 flex-1">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/15">
                  <div>
                    <p className="text-[13px] font-bold text-foreground/90">{r.name}</p>
                    <p className="text-[11.5px] text-muted-foreground/60 font-medium">{r.location}</p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="w-full max-w-3xl mx-auto px-6 py-24" aria-labelledby="faq-heading">
        <div className="text-center mb-12 select-none">
          <h2 id="faq-heading" className="text-[2.25rem] md:text-[2.75rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4 leading-tight">
            Common questions.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto leading-relaxed font-medium">
            Everything most people ask before getting a quote.
          </p>
        </div>

        <div className="space-y-2.5 stagger-children">
          {FAQS.map((f) => (
            <details key={f.q} className="group bg-card border border-border/25 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none text-left text-[14.5px] font-bold text-foreground/90 list-none [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-5 pb-4 text-[13.5px] text-muted-foreground/65 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA / Contact ──────────────────────────── */}
      <section id="contact" className="scroll-mt-28 w-full max-w-4xl mx-auto px-6 py-28 text-center" aria-label="Get in touch">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/30 px-4 py-1.5 mb-6 select-none">
          <Mail className="w-3.5 h-3.5 text-primary" aria-hidden />
          <span className="text-[12px] font-medium text-muted-foreground/75">Get in touch</span>
        </div>
        <h2 className="text-[2.75rem] md:text-[3.5rem] font-semibold tracking-[-0.03em] leading-[1.05] text-foreground/90 mb-5">
          Planning a build?
        </h2>
        <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto leading-relaxed mb-10">
          Tell us about your project and we&apos;ll get back to you with next steps —
          from a single wall to a full house build, anywhere on the island.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href="tel:+94763667924"
            className="inline-flex items-center gap-2.5 h-12 px-8 bg-foreground text-background text-[15px] font-bold rounded-2xl hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-elevated"
          >
            <Phone className="w-4.5 h-4.5" aria-hidden />
            076 366 7924
          </a>
          <a
            href="mailto:info@inbuilders.lk"
            className="inline-flex items-center gap-2.5 h-12 px-8 border border-border/30 bg-card/60 text-foreground/80 text-[15px] font-semibold rounded-2xl hover:bg-accent/50 hover:border-border/50 transition-all duration-200 backdrop-blur-sm"
          >
            <Mail className="w-4.5 h-4.5" aria-hidden />
            info@inbuilders.lk
          </a>
        </div>
        <div className="mb-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-10 px-6 text-foreground/60 text-[13.5px] font-semibold rounded-xl hover:bg-accent/40 hover:text-foreground transition-all"
          >
            Team login
            <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="w-full border-t border-border/15 bg-accent/5" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 select-none">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-white shadow-surface flex-shrink-0" aria-hidden>
              <Image src="/images/logo.png" alt="" fill className="object-contain p-0.5" sizes="28px" />
            </div>
            <span className="font-bold text-[14px] text-foreground/80">IN Builders</span>
          </div>
          <p className="text-[12px] text-muted-foreground/50 font-medium">
            &copy; {new Date().getFullYear()} IN Builders. Construction &amp; building contractors, Sri Lanka.
          </p>
          <div className="flex items-center gap-5 text-[12px] font-semibold text-muted-foreground/55">
            <a href="tel:+94763667924" className="hover:text-foreground transition-colors">076 366 7924</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Team Login</Link>
          </div>
        </div>
      </footer>

      <ProjectGalleryModal project={activeProject} onClose={() => setActiveProject(null)} />
    </div>
  );
}
