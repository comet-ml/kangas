// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';
import fetchData from './fetchData';
import { getColor } from './generateChartColor';

const fetchCategory = async (query) => {
    const data = await fetchIt({url: `${config.apiUrl}category`, query});

    if (data?.type === 'verbatim') {
        return {
            isVerbatim: true,
            ...data
        };
    }

    const sorted = Object.keys(data?.values ?? {})
        .sort()
        .reduce((obj, key) => {
            obj[key] = data?.values[key];
            return obj;
        }, {});

    const formattedData = [
        {
            type: 'bar',
            orientation: 'h',
            x: Object.values(sorted),
            y: Object.keys(sorted),
            text: Object.keys(sorted).map(
                (key) => `${data?.column}: ${key} ${data?.message || ''}`
            ),
            marker: {
                color: Object.keys(sorted).map(getColor),
            },
        }
    ];


    return formattedData;
}


export default fetchCategory;
