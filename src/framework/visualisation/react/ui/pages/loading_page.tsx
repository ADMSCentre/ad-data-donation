import React from 'react';
import { Spinner } from '../elements/spinner';
import { PacmanLoader } from 'react-spinners';
import withDarkModeLoader from '../elements/loader_wrapper';

const ThemedPacmanLoader = withDarkModeLoader(PacmanLoader);

function LoadingPage() {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className="flex flex-col items-center justify-center h-h-full">
      <ThemedPacmanLoader size={48} />
      <h2 className="text-2xl font-bold text-gray-700">
        Preparing donation workflow. Please wait a few seconds.
      </h2>
    </div>
  );
}

export default LoadingPage;
