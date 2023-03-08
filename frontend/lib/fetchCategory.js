// Config
import config from '../config';

// Utils
import fetchIt from './fetchIt';
import fetchData from './fetchData';
import { getColor } from './generateChartColor';

const fetchCategory = async (query, ssr=false) => {
    //const queryString = new URLSearchParams(query).toString();
    //const data = await fetch(`http://localhost:4000/category?${queryString}`)

    const data = ssr ? 
        await fetchIt({ url: `${config.apiUrl}category`, query}) : 
        await fetchIt({url: `/api/category`, query});
        
    if (data?.error) {
        return data;
    }

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
