import React from 'react';
import { Spinner } from '../elements/spinner';

function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-h-full bg-gray-200">
      <Spinner spinning={true} color="dark" size={10} />
      <h2 className="text-2xl font-bold text-gray-700">
        Loading, please wait...
      </h2>
    </div>
  );
}

export default LoadingPage;
