import {env} from 'process';

const localConfig = {
    apiUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    rootUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.PORT}/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
    hideSelector: env.KANGAS_HIDE_SELECTOR === '1',
    cache: true,
    prefetch: false,
    debug: false
};

export default localConfig;
