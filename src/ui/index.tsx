import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <HashRouter>
            <div style={{width: '100%', height: '100%', background: 'gray'}}></div>
            {/* <ThemeProvider theme={theme}> */}
            {/*     <App /> */}
            {/* </ThemeProvider> */}
        </HashRouter>
    </React.StrictMode>
);
