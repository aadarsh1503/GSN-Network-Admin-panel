// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaPlus, FaBars, FaTimes } from 'react-icons/fa';
import GSN from "./GSN.jpg"
const Navbar = () => {
  // State for the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for scroll effects
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Logic for background change
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Logic for hide/show navbar
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowNavbar(false);
      } else {
        // Scrolling up
        setShowNavbar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Navigation links data
  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#' },
    { name: 'Member', href: '#' },
    { name: 'Business', href: '#' },
    { name: 'Blacklist', href: '#' },
    { name: 'Contact Us', href: '#', icon: <FaSearch size={14} /> },
    { name: 'Login', href: '#', icon: <FaUser size={14} /> },
    { name: 'Register', href: '#' },
  ];

  const navClasses = `
    fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out
    ${isScrolled ? 'bg-white text-black shadow-md' : 'bg-[#111111] text-white'}
    ${showNavbar ? 'translate-y-0' : '-translate-y-full'}
  `;

  return (
    <header className={navClasses}>
      <div className="container max-w-7xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="flex-shrink-0">
          <img src={GSN} alt="Logistics Logo" className="h-24" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="flex items-center space-x-2 font-medium hover:text-[#CDA435] transition-colors">
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
        </nav>

        {/* Request Quote Button (Desktop) */}
        <a href="#" className="hidden md:flex items-center bg-[#CDA435] text-white font-bold py-3 px-5 rounded-md hover:bg-yellow-600 transition-colors">
          <FaPlus className="mr-2" />
          <div className="flex whitespace-nowrap text-left text-sm leading-tight">
            Request Quote
            
          </div>
        </a>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white text-black absolute top-full left-0 w-full shadow-lg">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="flex items-center space-x-2 font-medium hover:text-[#CDA435] transition-colors">
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}
            <a href="#" className="flex items-center justify-center bg-[#CDA435] text-white font-bold py-3 px-5 rounded-md hover:bg-yellow-600 transition-colors">
              <FaPlus className="mr-2" />
              <div className="flex flex-col whitespace-nowrap text-left text-sm leading-tight">
                Request Quote
               
              </div>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;