import * as React from "react";
import { Header } from "./ui/elements/header";

interface MainProps {
  elements: JSX.Element[];
}

export const Main = ({ elements }: MainProps): JSX.Element => {
  elements = elements.map((element, index) => {
    return { ...element, key: `${index}` };
  });

  return <Standalone elements={elements} />;
};

const Embedded = ({ elements }: MainProps): JSX.Element => {
  return <div className="max-w-7xl w-full h-full">{elements}</div>;
};

const Standalone = ({ elements }: MainProps): JSX.Element => {
  return (
    <div>
      <div className="p-4 sm:p-8 md:p-12 flex justify-center w-full h-full">
        <div className="max-w-3xl">{elements}</div>
      </div>
    </div>
  );
};
