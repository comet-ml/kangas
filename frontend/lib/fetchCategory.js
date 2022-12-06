// Config
import config from '../config';

// Utils
import fetchData from './fetchData';
import { getColor } from './generateChartColor';
const fetchCategory = async ({ query }) => {
    const data = await fetchData({
        url: `${config.apiUrl}category`,
        query,
        method: 'POST',
    });

    return data;
};


const fetchCategoryNew = async (query) => {
    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
    };

    const res = await fetch(`${config.apiUrl}category`, request);
    let data = {}
    try {
        data = await res.json();
    } catch(e) {
        console.log(query)
        console.log(e);
        console.timeLog(res);
    }

    console.log('data');
    console.log(data);

    if (data?.type === 'verbatim') {
        return {
            isVerbatim: true,
            ...data
        }
    }

    const sorted = Object.keys(data.values)
        .sort()
        .reduce((obj, key) => {
            obj[key] = data.values[key];
            return obj;
        }, {});

    const formattedData = [
        {
            type: 'bar',
            orientation: 'h',
            x: Object.values(sorted),
            y: Object.keys(sorted),
            text: Object.keys(sorted).map(
                (key) => `${data.column}: ${key} ${data.message || ''}`
            ),
            marker: {
                color: Object.keys(sorted).map(getColor),
            },
        }
    ];



    return formattedData;
}

export {
    fetchCategoryNew
}


export default fetchCategory;
