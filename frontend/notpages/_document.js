import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
// TODO Refactor this hard-coded injection point when we migrate to Next 13
export default function Document() {
    return (
        <Html>
            <Head>
                <Script src='/scripts/ga.js' strategy='afterInteractive' />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
