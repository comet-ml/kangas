// import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import ClientContext from '../lib/contexts/EnvContext';
import config from '../config';
// TODO Insert head scripts again
const RootLayout = ({ children }) => {
    return (
        <html>
            <ClientContext apiUrl={config.apiUrl} isColab={config.isColab}>
                <body>
                    { children }
                </body>
            </ClientContext>
        </html>
    );
}

export default RootLayout;