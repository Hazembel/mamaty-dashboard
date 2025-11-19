import React from 'react';

interface PageLayoutProps {
  title: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, headerContent, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-border-color flex flex-col h-full">
    <div className="p-4 sm:p-6 border-b border-border-color flex flex-col md:flex-row justify-between md:items-center gap-4">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <div>
        {headerContent}
      </div>
    </div>
    <div className="flex-1 flex flex-col">
        {children}
    </div>
  </div>
);

export default PageLayout;
