"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-10 md:py-16">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-3xl">C</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Business Intelligence, Simplified
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Get instant insights about your business operations with natural language queries. No complex dashboards, just ask and receive.
            </p>
            
            {/* CTA Button */}
            <div className="space-y-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5"
              >
                Get Started
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-blue-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Natural Language Queries</h3>
              <p className="text-gray-600">Ask questions in plain English and get instant insights about your business.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-purple-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">Get up-to-the-minute insights about your operations and performance.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-blue-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is protected with enterprise-grade security and encryption.</p>
            </div>
          </div>

          {/*
          <div className="mt-24 text-center">
            <h2 className="text-lg font-semibold text-gray-600 tracking-wider uppercase mb-12">
              Trusted by leading companies
            </h2>
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-center">
                <div className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <Image
                    // If your logo has a different name or extension, change it here.
                    src="/logos/12-bones-logo.png"
                    alt="12 Bones Smokehouse and Brewing Logo"
                    width={160}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          */}

        </div>
      </div>
    </div>
  );
}
