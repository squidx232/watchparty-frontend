/**
 * Landing Page - Pillow Watch
 * 
 * Features:
 * - Static hero mockup with animated chat
 * - Scroll-triggered animations for features/CTA
 * - Premium cohesive design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Play, 
  Pause,
  Users, 
  MessageCircle, 
  Zap, 
  ArrowRight, 
  Monitor, 
  Share2,
  Settings,
  Volume2,
  Maximize,
  Moon,
  Heart,
  Sofa,
  Tv,
  Radio
} from 'lucide-react';

// Chat messages - organized: left = others, right = you (Alex)
const chatMessages = [
  { id: 1, name: 'Emma', avatar: 'https://i.pravatar.cc/100?img=1', message: 'The transitions in this edit are insane', isOwn: false },
  { id: 2, name: 'You', avatar: 'https://i.pravatar.cc/100?img=3', message: 'Right? The song choice is perfect too', isOwn: true },
  { id: 3, name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=5', message: 'Wait for this next part, the drop hits different', isOwn: false },
  { id: 4, name: 'Mike', avatar: 'https://i.pravatar.cc/100?img=8', message: 'The editing skills here are next level', isOwn: false },
  { id: 5, name: 'You', avatar: 'https://i.pravatar.cc/100?img=3', message: 'This is my favorite part coming up', isOwn: true },
  { id: 6, name: 'Emma', avatar: 'https://i.pravatar.cc/100?img=1', message: 'We need to watch more of these together', isOwn: false },
];

export default function LandingPage() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showJoinNotification, setShowJoinNotification] = useState(false);
  const [isVisible, setIsVisible] = useState({
    features: false,
    cta: false,
  });
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Animate chat messages appearing one by one
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    chatMessages.forEach((msg, index) => {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => [...prev, msg.id]);
      }, 1000 + index * 700);
      timers.push(timer);
    });

    // Show join notification after all messages
    const joinTimer = setTimeout(() => {
      setShowJoinNotification(true);
    }, 1000 + chatMessages.length * 700 + 800);
    timers.push(joinTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-section');
          if (id) {
            setIsVisible((prev) => ({ ...prev, [id]: entry.isIntersecting }));
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );

    const sections = [featuresRef, ctaRef];
    sections.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080c] overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-20%] left-[10%] w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)' }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#08080c]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Pillow Watch" 
                width={52} 
                height={52}
                className="rounded-xl"
              />
              <span className="text-xl font-bold text-white">Pillow Watch</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/join" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
                Join Room
              </Link>
              <Link href="/create" className="btn-gradient text-sm">
                Create Room
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <div className="w-full max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center mb-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6">
              <Moon className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-white/60">Watch parties, reimagined</span>
            </div>

            {/* Headline with Animated "Together" */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
              <span className="text-white">Watch </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                  Together
                </span>
                <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-violet-500/40 animate-pulse-slow" />
                <span className="absolute -top-2 -right-2 w-2 h-2 bg-violet-400 rounded-full animate-ping" />
              </span>
              <span className="text-white">, Anywhere</span>
            </h1>

            {/* Subheadline - Concise and brandable */}
            <p className="text-base sm:text-lg text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">
              Sync videos with friends in real-time. No downloads, no hassle.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                href="/create"
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sofa className="w-5 h-5" />
                  Start a Pillow Party
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/join"
                className="px-8 py-4 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] rounded-2xl font-semibold text-white transition-all duration-300"
              >
                Join a Room
              </Link>
            </div>
          </div>

          {/* Static Mockup - Screenshot Style */}
          <div className="relative">
            {/* Ambient glow behind mockup */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-violet-500/15 via-fuchsia-500/5 to-transparent blur-3xl" />
            </div>

            {/* Screenshot Frame */}
            <div className="relative bg-[#0d0d14] rounded-2xl border border-white/[0.08] shadow-[0_0_80px_rgba(139,92,246,0.12)] overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0a10]">
                <div className="flex items-center gap-3">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    width={32} 
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="text-sm font-medium text-white">Movie Night</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60">
                    <Share2 className="w-3.5 h-3.5" />
                    Invite
                  </button>
                  <button className="px-4 py-1.5 bg-violet-600 rounded-lg text-xs font-medium text-white">
                    Invite
                  </button>
                  <button className="p-1.5 text-white/40">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex">
                {/* Video Area - YouTube Thumbnail */}
                <div className="flex-1 relative aspect-video bg-black overflow-hidden">
                  {/* YouTube Video Thumbnail */}
                  <img 
                    src="https://img.youtube.com/vi/ejJzoB2J--U/maxresdefault.jpg" 
                    alt="Video Thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Now Playing Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] sm:text-xs text-white/80 font-medium">Now Playing</span>
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
                    {/* Progress Bar */}
                    <div className="relative h-1 bg-white/20 rounded-full mb-2 sm:mb-3 overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-[42%] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 sm:p-2 text-white/70">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="white" />
                        </button>
                        <button className="p-1.5 sm:p-2 text-white/70">
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />
                        <button className="p-1.5 sm:p-2 text-white/70 hidden sm:block">
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-[10px] sm:text-xs text-white/50 ml-1 sm:ml-2">1:47 / 4:12</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 sm:p-2 text-white/70 hidden sm:block">
                          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button className="p-1.5 sm:p-2 text-white/70">
                          <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Panel - Organized colors */}
                <div className="w-72 lg:w-80 bg-[#0a0a10] border-l border-white/[0.06] flex-col hidden md:flex">
                  {/* Chat Header with Avatars */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center -space-x-2">
                      <img src="https://i.pravatar.cc/100?img=1" alt="Emma" className="w-7 h-7 rounded-full border-2 border-[#0a0a10] object-cover" style={{ zIndex: 4 }} />
                      <img src="https://i.pravatar.cc/100?img=3" alt="You" className="w-7 h-7 rounded-full border-2 border-[#0a0a10] object-cover" style={{ zIndex: 3 }} />
                      <img src="https://i.pravatar.cc/100?img=5" alt="Sarah" className="w-7 h-7 rounded-full border-2 border-[#0a0a10] object-cover" style={{ zIndex: 2 }} />
                      <img src="https://i.pravatar.cc/100?img=8" alt="Mike" className="w-7 h-7 rounded-full border-2 border-[#0a0a10] object-cover" style={{ zIndex: 1 }} />
                      <div className="w-7 h-7 rounded-full border-2 border-[#0a0a10] bg-white/[0.06] flex items-center justify-center text-[9px] text-white/50" style={{ zIndex: 0 }}>+2</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-white/40">Live</span>
                    </div>
                  </div>

                  {/* Chat Messages - Organized: others left, own right */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 transition-all duration-500 ${
                          visibleMessages.includes(msg.id) 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 translate-y-4'
                        } ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {!msg.isOwn && (
                          <img src={msg.avatar} alt={msg.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        )}
                        <div className={`max-w-[80%] ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                          {!msg.isOwn && (
                            <span className="text-[10px] text-white/40 ml-1 mb-0.5 block">{msg.name}</span>
                          )}
                          <div className={`px-3 py-2 text-xs ${
                            msg.isOwn 
                              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-md' 
                              : 'bg-white/[0.06] text-white/70 rounded-2xl rounded-bl-md'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Synced indicator */}
                    <div className={`text-center pt-2 transition-all duration-500 delay-300 ${
                      visibleMessages.length === chatMessages.length ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <span className="text-[10px] text-green-400/60 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        All synced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Notification - Animated */}
            <div 
              className={`absolute -bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#0d0d14]/90 backdrop-blur-xl rounded-full border border-white/[0.08] flex items-center gap-2 transition-all duration-700 ${
                showJoinNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <img src="https://i.pravatar.cc/100?img=12" alt="Jake" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs text-white/70"><span className="text-violet-400 font-medium">Jake</span> joined the party</span>
            </div>

            {/* Decorative Star */}
            <div className="absolute -bottom-12 -right-4 text-white/[0.06]">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned to match UI */}
      <section 
        ref={featuresRef}
        data-section="features"
        className="relative py-28 px-4"
      >
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div 
            className={`text-center mb-14 transition-all duration-700 ${
              isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Built for seamless watch parties with friends
            </p>
          </div>

          {/* Features Grid - Matching premium UI style */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { 
                icon: Zap, 
                title: 'Perfect Sync', 
                desc: 'Play, pause, and seek together. Everyone watches the exact same moment.',
                delay: 0 
              },
              { 
                icon: Users, 
                title: 'Invite Anyone', 
                desc: 'Share a simple link. No downloads, no accounts required.',
                delay: 100 
              },
              { 
                icon: MessageCircle, 
                title: 'Live Chat', 
                desc: 'React and discuss in real-time while watching together.',
                delay: 200 
              },
              { 
                icon: Monitor, 
                title: 'Any Content', 
                desc: 'YouTube, direct videos, or browse together with Hyperbeam.',
                delay: 300 
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group relative p-6 bg-[#0d0d14] border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-all duration-500 ${
                  isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-violet-400 mb-4 group-hover:border-violet-500/30 transition-colors">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - With scroll animation */}
      <section 
        ref={ctaRef}
        data-section="cta"
        className="relative py-24 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <div 
            className={`relative p-10 sm:p-12 bg-[#0d0d14] border border-white/[0.06] rounded-3xl text-center overflow-hidden transition-all duration-700 ${
              isVisible.cta ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-radial from-violet-500/10 via-transparent to-transparent" />
            </div>
            
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <Tv className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready for Movie Night?
            </h2>
            <p className="text-white/40 mb-8 text-sm sm:text-base">
              No sign-up needed. Create a room in seconds and invite your friends.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              Start Watching
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-6 px-4 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={40} 
              height={40}
              className="rounded-xl"
            />
            <span className="font-semibold text-white">Pillow Watch</span>
          </div>
          <p className="text-white/30 text-xs sm:text-sm">
            Made for cozy movie nights
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
