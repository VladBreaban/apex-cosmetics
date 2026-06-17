import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import waterDropBg from "@assets/generated_images/water_header_bg.png";

const SUPPORT_EMAIL = "hello@apexhealth.com";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (800) 555-0142",
    href: "tel:+18005550142",
  },
  {
    icon: MapPin,
    label: "Laboratory",
    value: "1 Peptide Way, San Francisco, CA 94107",
    href: null,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon–Fri · 9am – 6pm PT",
    href: null,
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const composedSubject = subject.trim() || `Inquiry from ${name.trim() || "a customer"}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      composedSubject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast({
      title: "Opening your email app",
      description: "Your message is ready to send to our team.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <section className="relative overflow-hidden pt-44 pb-24">
        <motion.img
          src={waterDropBg}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.5, scale: 1 }}
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
              Get in Touch
            </span>
            <h1 className="font-display text-5xl md:text-6xl mt-6 leading-[1.05] text-foreground">
              We'd love to hear from you.
            </h1>
            <p className="text-muted-foreground font-light leading-relaxed mt-6 text-lg">
              Questions about our copper peptide protocols, your order, or
              ingredient science? Our team responds within one business day.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-12 -mt-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <h2 className="font-display text-2xl text-foreground mb-2">
                Contact details
              </h2>
              <p className="text-sm font-light text-muted-foreground">
                Reach us directly or send a message — whatever's easiest.
              </p>
            </div>
            <ul className="space-y-6">
              {contactDetails.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-start gap-4">
                    <span className="w-11 h-11 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm text-foreground font-light">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="block group hover:opacity-80 transition-opacity"
                        data-testid={`link-contact-${item.label.toLowerCase()}`}
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-border rounded-sm p-8 md:p-10 shadow-[0_24px_60px_-30px_rgba(37,99,235,0.25)]"
              data-testid="form-contact"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-2 mt-6">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us a little more…"
                  rows={6}
                  required
                  data-testid="input-message"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-8 bg-primary text-white py-[1.1rem] rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors duration-300 flex items-center justify-center gap-2"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
