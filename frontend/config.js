import {env} from 'process';

const localConfig = {
    defaultDecimalPrecision: 5,
    locale: 'en-US',
};

if (env.KANGAS_BACKEND_PROXY) {
    localConfig.apiUrl = env.KANGAS_BACKEND_PROXY;
} else {
    localConfig.apiUrl = `http://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`;
}

export default localConfig;
