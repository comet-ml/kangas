// import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import ConfigProvider from '@kangas/app/contexts/ConfigContext';
import config from '@kangas/config';

const RootLayout = ({ children }) => {
    return (
        <html>
            <Script src='/scripts/ga.js' strategy='afterInteractive' />
            <ConfigProvider value={{
                config
            }}>
                <body>
                    { children }
                </body>
            </ConfigProvider>
        </html>
    );
};

export default RootLayout;
