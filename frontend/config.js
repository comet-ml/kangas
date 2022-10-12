import {env} from 'process';

const localConfig = {
    apiUrl: `http://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
};

export default localConfig;
