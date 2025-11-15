import React from 'react';

// A curated list of colors for popular languages
const LANGUAGE_COLORS: { [key: string]: string } = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Go': '#00ADD8',
  'Swift': '#ffac45',
  'Kotlin': '#F18E33',
  'Rust': '#dea584',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Shell': '#89e051',
  'Terraform': '#623CE4',
  'HCL': '#623CE4',
};

interface LanguageDotProps {
  language: string | null;
  className?: string;
}

const LanguageDot: React.FC<LanguageDotProps> = ({ language, className = '' }) => {
  if (!language) return null;

  const color = LANGUAGE_COLORS[language] || '#A4A4C8'; // Default color

  return (
    <span 
      className={`inline-block h-3 w-3 rounded-full ${className}`} 
      style={{ backgroundColor: color }}
      title={language}
    />
  );
};

export default LanguageDot;