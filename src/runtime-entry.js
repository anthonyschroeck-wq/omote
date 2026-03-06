// Omote Runtime Bundle — served at /omote-runtime.js
// This file is built by: npx vite build --config vite.runtime.config.js

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as Recharts from "recharts";

window.React = React;
window.ReactDOM = { ...ReactDOM, ...ReactDOMClient };
window.Recharts = Recharts;
window.__OMOTE_RUNTIME_READY__ = true;
