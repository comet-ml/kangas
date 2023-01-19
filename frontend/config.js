import {env} from 'process';

const localConfig = {
    apiUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    rootUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.PORT}/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
    isColab: env.IN_COLAB === 'True',
    cache: true,
    prefetch: true
};

export default localConfig;
