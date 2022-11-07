import '../components/page.css';
import '../components/Cells/Image/ImageCanvas.css';
import '../components/SettingsBar/HelpText.css';
import Head from 'next/head';

const MyApp = ({ Component, pageProps }) => {
    return (
        <>
            <Head>
                <link rel="icon" type="image/png" href="/favicon.png" />
                <title>Kangas - Data and Model Analysis</title>
            </Head>
            <Component {...pageProps} />
        </>
    );
};

export default MyApp;
