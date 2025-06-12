import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClick = () => {
    setIsMobileMenuOpen(false)
  }

  // Function to check if current path is active
  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-green-50 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 z-50 flex-wrap">
      {/* Logo dan Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <img 
          src="images/logo.png" 
          alt="Logo" 
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
        />
        <span className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-800">
          NutriScan
        </span>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="lg:hidden block text-gray-700 hover:text-green-500 bg-transparent border-none cursor-pointer p-2 rounded-md transition-colors duration-200"
        onClick={toggleMenu}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop Menu */}
      <ul className="hidden lg:flex gap-6 xl:gap-8 list-none m-0 p-0">
        <li>
          <Link
            to="/beranda"
            onClick={handleMenuClick}
            className={`block text-gray-700 hover:text-green-500 no-underline font-medium py-2 transition-all duration-200 ease-in-out text-sm lg:text-base xl:text-lg relative ${
              isActive('/beranda') 
                ? 'text-green-600 font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500' 
                : 'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full'
            }`}
          >
            Beranda
          </Link>
        </li>
        <li>
          <Link
            to="/Scan"
            onClick={handleMenuClick}
            className={`block text-gray-700 hover:text-green-500 no-underline font-medium py-2 transition-all duration-200 ease-in-out text-sm lg:text-base xl:text-lg relative ${
              isActive('/Scan') 
                ? 'text-green-600 font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500' 
                : 'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full'
            }`}
          >
            Scan
          </Link>
        </li>
        <li>
          <Link
            to="/riwayat"
            onClick={handleMenuClick}
            className={`block text-gray-700 hover:text-green-500 no-underline font-medium py-2 transition-all duration-200 ease-in-out text-sm lg:text-base xl:text-lg relative ${
              isActive('/riwayat') 
                ? 'text-green-600 font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500' 
                : 'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full'
            }`}
          >
            Riwayat
          </Link>
        </li>
        <li>
          <Link
            to="/Profil"
            onClick={handleMenuClick}
            className={`block text-gray-700 hover:text-green-500 no-underline font-medium py-2 transition-all duration-200 ease-in-out text-sm lg:text-base xl:text-lg relative ${
              isActive('/Profil') 
                ? 'text-green-600 font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500' 
                : 'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full'
            }`}
          >
            Profil
          </Link>
        </li>
      </ul>

      {/* Mobile Menu */}
      <ul className={`${
        isMobileMenuOpen 
          ? 'flex opacity-100 visible translate-y-0' 
          : 'hidden opacity-0 invisible translate-y-2'
      } lg:hidden flex-col w-full mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 gap-2 list-none m-0 transform transition-all duration-300 ease-in-out`}>
        <li className="w-full">
          <Link
            to="/beranda"
            onClick={handleMenuClick}
            className={`block w-full text-gray-700 hover:text-green-500 hover:bg-green-50 no-underline font-medium py-3 px-3 rounded-md transition-all duration-200 ease-in-out text-sm ${
              isActive('/beranda') ? 'text-green-600 bg-green-100 font-semibold' : ''
            }`}
          >
            Beranda
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/Scan"
            onClick={handleMenuClick}
            className={`block w-full text-gray-700 hover:text-green-500 hover:bg-green-50 no-underline font-medium py-3 px-3 rounded-md transition-all duration-200 ease-in-out text-sm ${
              isActive('/Scan') ? 'text-green-600 bg-green-100 font-semibold' : ''
            }`}
          >
            Scan
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/riwayat"
            onClick={handleMenuClick}
            className={`block w-full text-gray-700 hover:text-green-500 hover:bg-green-50 no-underline font-medium py-3 px-3 rounded-md transition-all duration-200 ease-in-out text-sm ${
              isActive('/riwayat') ? 'text-green-600 bg-green-100 font-semibold' : ''
            }`}
          >
            Riwayat
          </Link>
        </li>
        <li className="w-full">
          <Link
            to="/Profil"
            onClick={handleMenuClick}
            className={`block w-full text-gray-700 hover:text-green-500 hover:bg-green-50 no-underline font-medium py-3 px-3 rounded-md transition-all duration-200 ease-in-out text-sm ${
              isActive('/Profil') ? 'text-green-600 bg-green-100 font-semibold' : ''
            }`}
          >
            Profil
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar