// import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

// TODO Insert head scripts again
const RootLayout = ({ children }) => {
    return (
        <html>
            <body>
                { children }
            </body>
        </html>
    );
}

export default RootLayout;