// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';
import formatValue from './formatValue';
import { getColor } from './generateChartColor';

const fetchHistogram = async (query, ssr=false) => {
    const data = ssr ? 
        await fetchIt({ url: `${config.apiUrl}histogram`, query }) : 
        await fetchIt({ url: `/api/histogram`, query });


    if (data?.error) {
        return data;
    }

    if (data?.type === 'verbatim') {
        return {
            isVerbatim: true,
            ...data
        };
    }

    // FIXME: show some version of stats for DATETIME
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
            statistics: data.columnType === 'DATETIME' ? [] : data.statistics,
        },
    ];

    return formattedData;
}


export default fetchHistogram;
