'use client';

import { 
  CheckSquare,
  Clock, 
  DollarSign,
  Gamepad2,
  Lightbulb,
  MessageSquare,
  PlayCircle, 
  Sparkles,
  Trophy,
  Users} from 'lucide-react';
import React, { useState } from 'react';

interface TestingScenarioProps {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Epic';
  estimatedTime: string;
  rewards: string[];
  tasks: string[];
  completed?: boolean;
  funFactor: number; // 1-5 stars
}

interface TestingScenariosProps {
  scenarios: TestingScenarioProps[];
  onScenarioClick?: (scenarioId: string) => void;
  className?: string;
}

/**
 * TestingScenarios Component
 * 
 * A gamified component that presents beta testing scenarios as fun challenges
 * with creative names, difficulty ratings, and reward systems.
 */
export function TestingScenarios({ 
  scenarios, 
  onScenarioClick, 
  className = '' 
}: TestingScenariosProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          emoji: '🌱'
        };
      case 'Medium':
        return {
          color: 'text-equipment-yellow',
          bg: 'bg-yellow-100', 
          emoji: '🔥'
        };
      case 'Epic':
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          emoji: '🏆'
        };
      default:
        return {
          color: 'text-charcoal',
          bg: 'bg-stone-gray/10',
          emoji: '🎯'
        };
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Sparkles 
        key={i} 
        className={`w-4 h-4 ${
          i < count ? 'text-equipment-yellow fill-current' : 'text-stone-gray/30'
        }`} 
      />
    ));
  };

  return (
    <div 
      className={`
        bg-gradient-to-br from-purple-50 to-blue-50 
        rounded-3xl 
        p-8 
        my-12
        ${className}
      `}
      role="region"
      aria-labelledby="scenarios-title"
    >
      <div className="text-center mb-10">
        <h3 
          id="scenarios-title" 
          className="text-3xl font-bold text-forest-green mb-4 flex items-center justify-center gap-3"
        >
          <Gamepad2 className="w-8 h-8 text-purple-600 animate-pulse" />
          Testing Challenges: Pick Your Adventure!
          <Trophy className="w-8 h-8 text-equipment-yellow" />
        </h3>
        <p className="text-lg text-charcoal/80 max-w-3xl mx-auto">
          Choose your testing quest! Each scenario is designed to be fun, rewarding, and help you discover 
          QuoteKit&apos;s superpowers. Complete challenges to unlock rewards and level up your beta testing skills!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const difficultyConfig = getDifficultyConfig(scenario.difficulty);
          const isSelected = selectedScenario === scenario.id;
          const isCompleted = scenario.completed;
          
          return (
            <div
              key={scenario.id}
              className={`
                relative 
                bg-paper-white 
                rounded-2xl 
                border-2 
                p-6 
                transition-all 
                duration-300 
                cursor-pointer
                transform
                hover:scale-105
                hover:shadow-2xl
                ${
                  isCompleted 
                    ? 'border-green-400 shadow-green-100 bg-green-50/30' 
                    : 'border-stone-gray/20 hover:border-purple-300'
                }
                ${
                  isSelected 
                    ? 'ring-4 ring-purple-200 scale-105'
                    : ''
                }
              `}
              onClick={() => {
                setSelectedScenario(scenario.id);
                onScenarioClick?.(scenario.id);
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              {/* Completion Badge */}
              {isCompleted && (
                <div className="absolute -top-3 -right-3 bg-green-400 text-white rounded-full p-2 shadow-lg animate-bounce">
                  <CheckSquare className="w-5 h-5" />
                </div>
              )}

              {/* Difficulty Badge */}
              <div 
                className={`
                  inline-flex 
                  items-center 
                  gap-2 
                  px-3 
                  py-1 
                  rounded-full 
                  text-sm 
                  font-semibold 
                  mb-4
                  ${difficultyConfig.bg} 
                  ${difficultyConfig.color}
                `}
              >
                <span>{difficultyConfig.emoji}</span>
                {scenario.difficulty}
              </div>

              {/* Scenario Header */}
              <div className="mb-4">
                <h4 className="text-xl font-bold text-charcoal mb-2 flex items-start gap-2">
                  <PlayCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  {scenario.name}
                </h4>
                <p className="text-charcoal/80 text-sm leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              {/* Fun Factor */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-charcoal">Fun Factor:</span>
                <div className="flex gap-1">
                  {renderStars(scenario.funFactor)}
                </div>
              </div>

              {/* Time Estimate */}
              <div className="flex items-center gap-2 mb-4 text-charcoal/70">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{scenario.estimatedTime}</span>
              </div>

              {/* Rewards Preview */}
              {scenario.rewards.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-equipment-yellow" />
                    <span className="text-sm font-medium text-charcoal">Rewards:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {scenario.rewards.slice(0, 2).map((reward, index) => (
                      <span 
                        key={index}
                        className="inline-block bg-equipment-yellow/20 text-equipment-yellow px-2 py-1 rounded text-xs font-medium"
                      >
                        {reward}
                      </span>
                    ))}
                    {scenario.rewards.length > 2 && (
                      <span className="text-xs text-charcoal/60 px-2 py-1">
                        +{scenario.rewards.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tasks Preview */}
              <div className="border-t border-stone-gray/20 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-forest-green" />
                  <span className="text-sm font-medium text-charcoal">
                    Tasks ({scenario.tasks.length})
                  </span>
                </div>
                <ul className="text-xs text-charcoal/70 space-y-1">
                  {scenario.tasks.slice(0, 3).map((task, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{task}</span>
                    </li>
                  ))}
                  {scenario.tasks.length > 3 && (
                    <li className="text-charcoal/50 italic">
                      ...and {scenario.tasks.length - 3} more exciting tasks!
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Hint */}
              <div className="mt-4 pt-4 border-t border-stone-gray/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isCompleted ? 'Completed!' : 'Start Quest'}
                    </span>
                  </div>
                  <MessageSquare className="w-4 h-4 text-charcoal/40" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivation Footer */}
      <div className="text-center mt-10 p-6 bg-gradient-to-r from-purple-100/50 to-blue-100/50 rounded-2xl border border-dashed border-purple-300/30">
        <Trophy className="w-8 h-8 text-equipment-yellow mx-auto mb-3 animate-bounce" />
        <p className="text-lg font-bold text-charcoal mb-2">
          Ready to Become a Testing Legend?
        </p>
        <p className="text-charcoal/70 mb-4">
          Each quest completed brings you closer to QuoteKit mastery and unlocks exclusive beta tester rewards!
        </p>
        <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors cursor-pointer">
          <PlayCircle className="w-5 h-5" />
          Start Your First Quest
        </div>
      </div>
    </div>
  );
}

export default TestingScenarios;