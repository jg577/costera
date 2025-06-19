import Link from 'next/link';
import { Twitter, Linkedin, Facebook } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Customer Stories', href: '#' },
    { name: 'Request a Quote', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Press', href: '#' },
  ],
  resources: [
    { name: 'Blog', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Events & Webinars', href: '#' },
    { name: 'FAQs', href: '#' },
  ],
};

const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and mission */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 group mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Costera
              </h1>
            </Link>
            <p className="text-gray-500 text-sm">Business Intelligence, Simplified.</p>
          </div>

          {/* Link columns */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                {footerLinks.product.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-4">
                {footerLinks.resources.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col sm:flex-row-reverse justify-between items-center">
            <div className="flex space-x-6">
                {socialLinks.map((item) => (
                <Link key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                </Link>
                ))}
            </div>
            <p className="mt-8 sm:mt-0 text-base text-gray-400">&copy; {new Date().getFullYear()} Costera, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 