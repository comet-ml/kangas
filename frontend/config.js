import {env} from 'process';

const localConfig = {
    apiUrl: `${env.KANGAS_BACKEND_PROTOCOL || 'http'}://${env.KANGAS_BACKEND_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    rootUrl: `${env.KANGAS_FRONTEND_PROTOCOL || 'http'}://${env.KANGAS_FRONTEND_HOST}:${env.PORT}${env.KANGAS_FRONTEND_ROOT || ''}/`,
    rootPath: `${env.KANGAS_FRONTEND_ROOT || ''}/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
    hideSelector: env.KANGAS_HIDE_SELECTOR === '1',
    cache: true,
    prefetch: false,
    debug: false,
    dynamic: false,
};

export default localConfig;
