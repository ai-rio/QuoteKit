'use client';

import { 
  Crown,
  Gift, 
  Heart,
  PartyPopper,
  Sparkles,
  Star, 
  Trophy, 
  Zap} from 'lucide-react';
import React, { useEffect,useState } from 'react';

interface MilestoneProps {
  title: string;
  description: string;
  achievement: string;
  rewards?: string[];
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  unlockedFeatures?: string[];
  celebrationMessage?: string;
}

interface MilestoneCelebrationProps {
  milestone: MilestoneProps;
  showAnimation?: boolean;
  onCelebrationComplete?: () => void;
  className?: string;
}

/**
 * MilestoneCelebration Component
 * 
 * An over-the-top celebration component for beta testing milestones
 * with confetti animations, level-up effects, and shareable moments.
 */
export function MilestoneCelebration({ 
  milestone, 
  showAnimation = true,
  onCelebrationComplete,
  className = '' 
}: MilestoneCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      setShowConfetti(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowConfetti(false);
        onCelebrationComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showAnimation, onCelebrationComplete]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'Bronze':
        return {
          gradient: 'from-amber-600 to-amber-800',
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-700',
          icon: Trophy,
          emoji: '🥉'
        };
      case 'Silver':
        return {
          gradient: 'from-gray-400 to-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          icon: Star,
          emoji: '🥈'
        };
      case 'Gold':
        return {
          gradient: 'from-yellow-400 to-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-700',
          icon: Crown,
          emoji: '🥇'
        };
      case 'Platinum':
        return {
          gradient: 'from-purple-500 to-purple-700',
          bg: 'bg-purple-50',
          border: 'border-purple-300',
          text: 'text-purple-700',
          icon: Sparkles,
          emoji: '📎'
        };
      default:
        return {
          gradient: 'from-forest-green to-green-700',
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-700',
          icon: Trophy,
          emoji: '🏆'
        };
    }
  };

  const levelConfig = getLevelConfig(milestone.level);
  const LevelIcon = levelConfig.icon;

  return (
    <div 
      className={`
        relative 
        overflow-hidden 
        rounded-3xl 
        my-12
        ${className}
      `}
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute 
                w-3 
                h-3 
                animate-bounce
              `}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
                backgroundColor: ['#F2B705', '#2A3D2F', '#8B5CF6', '#EF4444', '#10B981'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`
          bg-gradient-to-br ${levelConfig.gradient} 
          p-1 
          rounded-3xl
          ${
            isAnimating ? 'animate-pulse scale-110' : ''
          }
          transition-transform duration-300
        `}
      >
        <div 
          className={`
            ${levelConfig.bg} 
            rounded-3xl 
            p-8 
            border-2 
            ${levelConfig.border}
          `}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <LevelIcon 
                className={`
                  w-20 
                  h-20 
                  mx-auto 
                  mb-4 
                  ${levelConfig.text}
                  ${
                    isAnimating ? 'animate-spin' : 'animate-bounce'
                  }
                `} 
              />
              {isAnimating && (
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`
                        absolute 
                        w-6 
                        h-6 
                        text-equipment-yellow 
                        animate-ping
                      `}
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 45}deg) translateY(-40px)`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <h3 className={`text-4xl font-bold ${levelConfig.text} mb-2`}>
              {levelConfig.emoji} MILESTONE UNLOCKED! {levelConfig.emoji}
            </h3>
            
            <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-6 py-2 border border-white/40">
              <span className="text-2xl">{levelConfig.emoji}</span>
              <span className={`font-bold text-xl ${levelConfig.text}`}>
                {milestone.level} Level
              </span>
            </div>
          </div>

          {/* Achievement Details */}
          <div className="text-center mb-8">
            <h4 className="text-2xl font-bold text-charcoal mb-3">
              {milestone.title}
            </h4>
            <p className="text-lg text-charcoal/80 max-w-2xl mx-auto mb-4">
              {milestone.description}
            </p>
            
            <div className="inline-flex items-center gap-2 bg-white/60 rounded-full px-6 py-3 border border-white/40">
              <Trophy className={`w-5 h-5 ${levelConfig.text}`} />
              <span className="font-semibold text-charcoal">
                Achievement: {milestone.achievement}
              </span>
            </div>
          </div>

          {/* Rewards Section */}
          {milestone.rewards && milestone.rewards.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Gift className={`w-6 h-6 ${levelConfig.text}`} />
                <h5 className="text-xl font-bold text-charcoal">
                  Rewards Unlocked!
                </h5>
                <PartyPopper className={`w-6 h-6 ${levelConfig.text}`} />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {milestone.rewards.map((reward, index) => (
                  <div 
                    key={index}
                    className="bg-white/80 rounded-2xl p-4 border border-white/40 flex items-center gap-3"
                  >
                    <Zap className={`w-5 h-5 ${levelConfig.text} flex-shrink-0`} />
                    <span className="font-medium text-charcoal">{reward}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Features */}
          {milestone.unlockedFeatures && milestone.unlockedFeatures.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className={`w-6 h-6 ${levelConfig.text}`} />
                <h5 className="text-xl font-bold text-charcoal">
                  New Features Unlocked!
                </h5>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {milestone.unlockedFeatures.map((feature, index) => (
                  <div 
                    key={index}
                    className={`
                      bg-gradient-to-r ${levelConfig.gradient} 
                      text-white 
                      rounded-full 
                      px-6 
                      py-2 
                      font-semibold 
                      shadow-lg
                      transform
                      hover:scale-105
                      transition-transform
                    `}
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Celebration Message */}
          <div className="text-center">
            <div className="bg-white/60 rounded-2xl p-6 border border-white/40 mb-6">
              <Heart className={`w-8 h-8 ${levelConfig.text} mx-auto mb-3`} />
              <p className="text-lg font-medium text-charcoal mb-2">
                {milestone.celebrationMessage || 
                  'Incredible work! You\'re helping shape the future of QuoteKit. Keep testing, keep improving, keep being awesome!'}
              </p>
              <p className="text-charcoal/70">
                Share your achievement and inspire other beta testers!
              </p>
            </div>
            
            {/* Social Share Hint */}
            <div className="flex justify-center gap-4">
              <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-semibold cursor-pointer hover:bg-blue-600 transition-colors">
                <Star className="w-5 h-5" />
                Share on Twitter
              </div>
              <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold cursor-pointer hover:bg-green-600 transition-colors">
                <Crown className="w-5 h-5" />
                Continue Journey
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MilestoneCelebration;