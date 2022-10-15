import {env} from 'process';

const localConfig = {
    apiUrl: `http://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    apiProxyUrl: `http://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
};

if (env.KANGAS_BACKEND_PROXY) {
    localConfig.apiProxyUrl = `${env.KANGAS_BACKEND_PROXY}/datagrid/`;
}

export default localConfig;
