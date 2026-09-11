import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppV2 from './v2/AppV2';
import './index.css';

const isV2 = /\/v2\/?$/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isV2 ? <AppV2 /> : <App />}
  </React.StrictMode>
);
