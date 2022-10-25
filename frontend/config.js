import {env} from 'process';

const localConfig = {
    apiUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    apiProxyUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
    inColab: env.IN_COLAB === 'True'
};

if (env.KANGAS_BACKEND_PROXY) {
    if (env.KANGAS_BACKEND_PROXY.endsWith('/'))
	localConfig.apiProxyUrl = `${env.KANGAS_BACKEND_PROXY}datagrid/`;
    else
	localConfig.apiProxyUrl = `${env.KANGAS_BACKEND_PROXY}/datagrid/`;
}

export default localConfig;
