import {env} from 'process';

const parseScripts = (scripts) => {
    console.log('hey');
    console.log(scripts)
    try {
        return JSON.parse(`[ ${scripts} ]`)
    } catch (error) {
        console.error(error)
        return []
    }
}
const localConfig = {
    apiUrl: `${env.KANGAS_PROTOCOL || 'http'}://${env.KANGAS_HOST}:${env.KANGAS_BACKEND_PORT}/datagrid/`,
    defaultDecimalPrecision: 5,
    locale: 'en-US',
    isColab: env.IN_COLAB === 'True',
    scripts: env.SCRIPTS?.split(" ") || []
};

export default localConfig;
