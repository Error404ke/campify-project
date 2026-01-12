import React from 'react';

type Props = {
  title?: string;
};

const Appp: React.FC<Props> = ({ title = 'Appp Component' }) => {
  return (
    <div className="appp-root">
      <h1>{title}</h1>
      <p>This is the appp.tsx component.</p>
    </div>
  );
};

export default Appp;
