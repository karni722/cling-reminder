'use client';

import { useState, useEffect } from 'react';

export default function UserAvatar({ userName, userEmail, fallbackInitial }) {
  const [avatarURL, setAvatarURL] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log('🔍 UserAvatar mounted'); // DEBUG
    console.log('📧 Props userEmail:', userEmail); // DEBUG
    
    // Priority 1: Check sessionStorage
    const storedAvatar = sessionStorage.getItem('userAvatar');
    const storedEmail = sessionStorage.getItem('userEmail');
    
    console.log('💾 SessionStorage Avatar:', storedAvatar); // DEBUG
    console.log('💾 SessionStorage Email:', storedEmail); // DEBUG

    if (storedAvatar && storedAvatar.includes('gravatar')) {
      // Add timestamp to force refresh
      const freshURL = `${storedAvatar}&t=${Date.now()}`;
      console.log('✅ Using stored avatar:', freshURL); // DEBUG
      setAvatarURL(freshURL);
      setIsLoading(false);
    } else if (storedEmail || userEmail) {
      console.log('🔄 Generating new avatar...'); // DEBUG
      generateAvatar(storedEmail || userEmail);
    } else {
      console.log('❌ No email found, using fallback'); // DEBUG
      setIsLoading(false);
    }
  }, [userEmail]);

  async function generateAvatar(email) {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log('🎨 Generating avatar for:', trimmedEmail); // DEBUG
      
      const encoder = new TextEncoder();
      const data = encoder.encode(trimmedEmail);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const hash = hashHex.substring(0, 32);
      
      // Add timestamp to prevent caching
      const avatarURL = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200&t=${Date.now()}`;
      console.log('🎯 Generated URL:', avatarURL); // DEBUG
      
      setAvatarURL(avatarURL);
      sessionStorage.setItem('userAvatar', avatarURL);
    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleImageError = (e) => {
    console.log('⚠️ Image load error, using fallback'); // DEBUG
    setHasError(true);
    
    // Fallback to UI Avatars
    const fallbackURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || userEmail)}&background=0d9488&color=fff&size=200&bold=true`;
    setAvatarURL(fallbackURL);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-gray-900 font-bold animate-pulse">
        {fallbackInitial}
      </div>
    );
  }

  // No avatar - show initial
  if (!avatarURL || hasError) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-gray-900 font-bold">
        {fallbackInitial}
      </div>
    );
  }

  // Show image
  return (
    <img
      src={avatarURL}
      alt={`${userName || userEmail} avatar`}
      className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-400/30 shadow-lg"
      onError={handleImageError}
      crossOrigin="anonymous"
    />
  );
}