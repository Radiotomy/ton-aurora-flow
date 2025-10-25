import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Heart, Mail, MessageCircle, Github, Twitter } from 'lucide-react';
import audiusBadge from '@/assets/audius-badge.png';

const Footer = () => {
  const footerLinks = {
    platform: [
      { label: 'Help Center', href: '/help' },
      { label: 'Fan Guide', href: '/help/fans' },
      { label: 'Artist Guide', href: '/help/artists' },
      { label: 'Discover Music', href: '/discover' },
      { label: 'Marketplace', href: '/marketplace' }
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
    community: [
      { label: 'Discord Server', href: '#', external: true },
      { label: 'Telegram Group', href: '#', external: true },
      { label: 'GitHub', href: '#', external: true },
      { label: 'Twitter', href: '#', external: true }
    ],
    support: [
      { label: 'Contact Support', href: 'mailto:support@audioton.app' },
      { label: 'Report a Bug', href: 'mailto:bugs@audioton.app' },
      { label: 'Feature Request', href: 'mailto:features@audioton.app' },
      { label: 'Partnership Inquiries', href: 'mailto:partners@audioton.app' }
    ]
  };

  return (
    <footer className="glass-panel border-t border-glass-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-aurora rounded-lg animate-glow-pulse flex items-center justify-center">
                <Music className="w-5 h-5 text-background" />
              </div>
              <span className="text-xl font-bold text-aurora">AudioTon</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The future of music - where streaming meets Web3. Support independent artists with TON blockchain payments.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="w-8 h-8 bg-muted/10 hover:bg-aurora/20 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Discord"
              >
                <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-aurora" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-muted/10 hover:bg-aurora/20 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 text-muted-foreground hover:text-aurora" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-muted/10 hover:bg-aurora/20 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-muted-foreground hover:text-aurora" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-aurora transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-aurora transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-aurora transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-sm text-muted-foreground hover:text-aurora transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-aurora transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-glass-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2024 AudioTon. All rights reserved.
            </div>

            {/* Radiotomy Attribution */}
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Designed and Developed with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 animate-pulse" />
              <span>for indie musicians by</span>
              <a 
                href="https://radiotomy.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 font-semibold text-aurora hover:text-aurora/80 transition-colors"
              >
                Radiotomy
              </a>
            </div>

            {/* Audius Badge */}
            <a 
              href="https://audius.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
              aria-label="Streaming from Audius"
            >
              <img 
                src={audiusBadge} 
                alt="Streaming from Audius" 
                className="h-8 md:h-10 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;