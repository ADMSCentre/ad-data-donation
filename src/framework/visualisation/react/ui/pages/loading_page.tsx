import React from 'react';
import { Spinner } from '../elements/spinner';

function LoadingPage() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className="flex flex-col items-center justify-center h-h-full">
      <Spinner spinning={true} color={
        prefersDarkMode ? 'light' : 'dark'
      } size={10} />
      <h2 className="text-2xl font-bold text-gray-700">
        Loading, please wait...
      </h2>
    </div>
  );
}

export default LoadingPage;
