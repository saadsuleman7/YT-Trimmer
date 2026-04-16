import React from 'react';
import { FiGithub, FiTwitter, FiLinkedin, FiGlobe } from 'react-icons/fi';

const Owners = () => {
  const team = [
    {
      name: 'Saad Suleman',
      role: 'Founder & Lead Developer',
      bio: 'Full-stack developer passionate about building tools that make the web more accessible. Created YT-Trimmer to simplify video downloading and editing.',
      avatar: 'SS',
      links: { github: '#', twitter: '#' },
    },
    {
      name: 'Dev Team',
      role: 'Core Contributors',
      bio: 'Our talented team of developers, designers, and QA engineers work together to deliver the best video processing experience.',
      avatar: 'DT',
      links: { github: '#' },
    },
    {
      name: 'Community',
      role: 'Open Source Contributors',
      bio: 'YT-Trimmer is built with the help of our amazing community. Join our Discord to contribute and help shape the future of the platform.',
      avatar: 'OS',
      links: { github: '#' },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          Meet Our <span className="gradient-text">Team</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          The people behind YT-Trimmer who make it all possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {team.map((member, i) => (
          <div key={i} className="card-hover p-8 text-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-dark-900 font-bold text-2xl">{member.avatar}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{member.name}</h3>
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">{member.role}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{member.bio}</p>
            <div className="flex justify-center space-x-3">
              {member.links.github && (
                <a href={member.links.github} className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FiGithub size={18} />
                </a>
              )}
              {member.links.twitter && (
                <a href={member.links.twitter} className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:text-blue-400 transition-colors">
                  <FiTwitter size={18} />
                </a>
              )}
              {member.links.linkedin && (
                <a href={member.links.linkedin} className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                  <FiLinkedin size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Owners;
