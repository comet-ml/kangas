import { Memory } from '@material-ui/icons';
import dynamic from 'next/dynamic';
import {
    Suspense,
    useState,
    useMemo,
    useCallback,
    useEffect,
    useRef,
    useContext,
} from 'react';
import formatChartText from '../../../lib/formatChartText';
import { getColor } from '../../../lib/generateChartColor';
import { ConfigContext } from '../ClientContext.client';
const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
});
const CategoryGroupClient = ({ value }) => {
    const [data, setData] = useState(null);
    const [dimensions, setDimensions] = useState(null);
    const appConfig = useContext(ConfigContext);

    const id = useRef(Math.random());

    const fetchData = useCallback(async () => {
        const res = await fetch(`${appConfig.apiUrl}category`, {
            body: JSON.stringify(value),
            method: 'post',
        });
        const parsed = await res.json();
        setData(parsed);
    }, [value]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /*
    useLayoutEffect(() => {
        const ours = document.getElementById(id.current);
        if (ours?.clientWidth && ( ours?.clientHeight > 30 )) {
            setDimensions({
                height: ours.clientHeight - 30,
                width: ours.clientWidth
            })
        }
    }, []);*/

    const sortedData = useMemo(() => {
        if (!data?.values) return;
        return Object.keys(data.values)
            .sort()
            .reduce((obj, key) => {
                obj[key] = data.values[key];
                return obj;
            }, {});
    }, [data]);

    const categoryData = useMemo(() => {
        if (!sortedData) return;
        return [
            {
                type: 'bar',
                orientation: 'h',
                x: Object.values(sortedData),
                y: Object.keys(sortedData),
                text: Object.keys(sortedData).map(
                    (key) => `${data.column}: ${key} ${data.message || ''}`
                ),
                marker: {
                    color: Object.keys(sortedData).map(getColor),
                },
            },
        ];
    }, [sortedData]);

    const layout = useMemo(() => {
        return {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            autosize: true,
            bargap: 0.1,
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 0,
            },
            showlegend: false,
            xaxis: {
                visible: true,
                showticklabels: true,
            },
            yaxis: {
                visible: true,
                showticklabels: true,
                type: 'category',
            },
        };
    }, [dimensions]);

    // Verbatim type:
    // {"type": "verbatim", "value": "1011 slug 3s, 1 each", "columnType": "TEXT", "message": "1001 slug 3s not showing"}

    if (data?.type === 'verbatim') {
        return <div className="cell-verbatim">{data.value}</div>;
    } else {
        return (
            <Plot
                style={{ height: '100%', width: '100%', maxHeight: '110px' }}
                data={categoryData}
                layout={layout}
                config={{ displayModeBar: false }}
            />
        );
    }
};

export default CategoryGroupClient;
