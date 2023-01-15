// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt'
import fetchData from './fetchData';
import formatValue from './formatValue';
import { getColor } from './generateChartColor';

const fetchHistogram = async (query) => {
    const data = await fetchIt({url: `${config.apiUrl}histogram`, query});

    if (data?.type === 'verbatim') {
        return {
            isVerbatim: true,
            ...data
        }
    }

    const formattedData = [
        {
            type: 'bar',
            x:
                data.columnType === 'DATETIME'
                    ? data.labels.map((v) => formatValue(v, 'DATETIME'))
                    : data.labels,
            y: data.bins,
            text: data?.labels?.map(
                (value) =>
                    `${data.column}: ${formatValue(
                        value,
                        data.columnType
                    )} ${data.message || ''}`
            ),
            marker: { color: getColor(data.column) },
        },
    ];



    return formattedData;
}


export default fetchHistogram;
