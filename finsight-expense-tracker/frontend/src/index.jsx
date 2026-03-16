import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'

console.log('Mounting Finsight App...');

try {
    const root = document.getElementById('root');
    if (!root) {
        console.error('Root element not found!');
        document.body.innerHTML = '<h1>Critical Error: Root element not found</h1>';
    } else {
        ReactDOM.createRoot(root).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        console.log('Render called');
    }
} catch (err) {
    console.error('Render crash:', err);
    document.body.innerHTML = `<h1>Application Crash</h1><pre>${err.stack}</pre>`;
}
