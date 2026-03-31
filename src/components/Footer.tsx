import { BookOpen, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="section-wrap py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-[0_8px_16px_rgba(80,127,83,0.2)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bookly</h3>
            </div>
            <p className="mt-4 text-sm text-foreground/70 max-w-xl leading-relaxed">
              Bookly is a modern online bookstore helping readers discover great titles faster with curated collections,
              trusted recommendations, and a clean shopping experience.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border/60 bg-background text-foreground/60 hover:text-primary hover:bg-primary/5 hover:border-primary/30 grid place-items-center transition-all duration-200"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/70">
              <li><Link to="/" className="hover:text-primary transition-colors duration-200">About</Link></li>
              <li><Link to="/browse" className="hover:text-primary transition-colors duration-200">Catalog</Link></li>
              <li><Link to="/favorites" className="hover:text-primary transition-colors duration-200">Favorites</Link></li>
              <li><Link to="/#help" className="hover:text-primary transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">Customer Care</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/70">
              <li>Mon - Fri: 8:00 AM - 6:00 PM</li>
              <li className="text-primary/80 font-medium">support@bookly.com</li>
              <li>+855 12 345 678</li>
              <li>Phnom Penh, Cambodia</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-xs text-foreground/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Bookly. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors duration-200">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
