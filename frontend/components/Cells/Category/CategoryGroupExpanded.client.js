import { Memory } from '@material-ui/icons';
import dynamic from 'next/dynamic';
import {
    Suspense,
    useState,
    useMemo,
    useCallback,
    useEffect,
    useRef,
    useLayoutEffect,
    useContext,
} from 'react';
import formatChartText from '../../../lib/formatChartText';
import { getColor } from '../../../lib/generateChartColor';

// Config
import { ConfigContext } from '../ClientContext.client';

const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
});

// It spiritually hurts me that this cannot be a server component - Caleb
const CategoryGroupClient = ({ value }) => {
    const appConfig = useContext(ConfigContext);
    const [data, setData] = useState(null);
    const [dimensions, setDimensions] = useState(null);

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

    useLayoutEffect(() => {
        const viewport = window.visualViewport;
        if (viewport?.width && viewport?.height) {
            setDimensions({
                height: viewport.height,
                width: viewport.width,
            });
        }
    }, []);

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
            autosize: true,
            title: `${value?.columnName}`,
            font: {
                family: 'Roboto',
                size: 22,
                color: '#191A1C',
            },
            xaxis: {
                font: {
                    size: 13,
                    color: '#3D4355',
                },
            },
            yaxis: {
                type: 'category'
	    },
        };
    }, [value]);

    // Verbatim type:
    // {"type": "verbatim", "value": "1011 slug 3s, 1 each", "columnType": "TEXT", "message": "1001 slug 3s not showing"}

    if (data?.type === 'verbatim') {
        return <div className="cell-verbatim-expanded">{data.value}</div>;
    } else {
        return (
            <div style={{ minWidth: '500px' }}>
                <Plot
                    style={{ height: '100%', width: '100%' }}
                    data={categoryData}
                    layout={layout}
                    config={{ displayModeBar: false }}
                />
            </div>
        );
    }
};

export default CategoryGroupClient;
