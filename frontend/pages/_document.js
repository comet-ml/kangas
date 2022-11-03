import { Html, Head, Main, NextScript } from 'next/document';
import config from '../config';

export default function Document() {
    return (
        <Html>
            <Head>
                { config?.scripts?.map(script => <script src={`/scripts/${script}`} />) }
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
