import { motion } from "framer-motion";
import waterDropBg from "@assets/generated_images/water_header_bg.png";

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <section className="relative overflow-hidden pt-44 pb-20">
        <motion.img
          src={waterDropBg}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.45, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {eyebrow}
            </span>
            <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05] text-foreground">
              {title}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-6">
              Last updated · {updated}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-lg font-light leading-relaxed text-muted-foreground">
            {intro}
          </p>
          <div className="mt-16 space-y-14">
            {sections.map((section, i) => (
              <motion.div
                key={section.heading}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="font-display text-2xl text-foreground mb-5">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.body.map((para, j) => (
                    <p key={j} className="text-sm font-light leading-relaxed text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
