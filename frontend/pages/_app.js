import '../components/page.css';
import '../components/Cells/Image/ImageCanvas.css';
import '../components/SettingsBar/HelpText.css';
import config from '../config';
import Head from 'next/head';
import Script from 'next/script';

const MyApp = ({ Component, pageProps }) => {
    return (
        <>
            <Head>
                <link rel="icon" type="image/png" href="/favicon.png" />
                <title>Kangas - Data and Model Analysis</title>
                { config?.scripts?.map(url => <Script src={url}/>) }
            </Head>
            <Component {...pageProps} />
        </>
    );
};

export default MyApp;
