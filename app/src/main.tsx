import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppV2 from './v2/AppV2';
import AppV3 from './v3/AppV3';
import AppV4 from './v4/AppV4Clean';
import AppV5 from './v5/AppV5';
import AppV6 from './v6/AppV6';
import './index.css';

const path = window.location.pathname;
const isV6 = /\/v6\/?$/.test(path);
const isV5 = /\/v5\/?$/.test(path);
const isV4 = /\/v4\/?$/.test(path);
const isV3 = /\/v3\/?$/.test(path);
const isV2 = /\/v2\/?$/.test(path);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isV6 ? <AppV6 /> : isV5 ? <AppV5 /> : isV4 ? <AppV4 /> : isV3 ? <AppV3 /> : isV2 ? <AppV2 /> : <App />}
  </React.StrictMode>
);
