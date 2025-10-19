import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OverlayApp from './OverlayApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const determineOverlayMode = () => {
  const hash = window.location.hash.toLowerCase();
  return hash === '#overlay' || hash === '#/overlay';
};

const root = ReactDOM.createRoot(rootElement);

const render = (isOverlay: boolean) => {
  root.render(
    <React.StrictMode>
      {isOverlay ? <OverlayApp /> : <App />}
    </React.StrictMode>
  );
};

render(determineOverlayMode());

const handleHashChange = () => {
  render(determineOverlayMode());
};

window.addEventListener('hashchange', handleHashChange);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('hashchange', handleHashChange);
  });
}
