import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppV2 from './v2/AppV2';
import AppV3 from './v3/AppV3';
import AppV4 from './v4/AppV4Clean';
import './index.css';

const path = window.location.pathname;
const isV4 = /\/v4\/?$/.test(path);
const isV3 = /\/v3\/?$/.test(path);
const isV2 = /\/v2\/?$/.test(path);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isV4 ? <AppV4 /> : isV3 ? <AppV3 /> : isV2 ? <AppV2 /> : <App />}
  </React.StrictMode>
);
