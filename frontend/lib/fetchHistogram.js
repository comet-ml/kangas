// Config
import config from '../config';

// Utils
import fetchData from './fetchData';
import formatValue from './formatValue';
import { getColor } from './generateChartColor';

const fetchHistogram = async ({ query }) => {
    const data = await fetchData({
        url: `${config.apiUrl}histogram`,
        query,
        method: 'POST',
    });

    return data;
};

const fetchHistogramNew = async (query) => {
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=604800'
        },
        body: JSON.stringify(query),
        next: {
            revalidate: 100000000000
        }

    };

    const res = await fetch(`${config.apiUrl}histogram`, request);
    const data = await res.json();

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

export {
    fetchHistogramNew
}

export default fetchHistogram;
