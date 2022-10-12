import dynamic from 'next/dynamic';
import {
    Suspense,
    useEffect,
    useState,
    useCallback,
    useMemo,
    useContext,
} from 'react';
import formatValue from '../../../lib/formatValue';
import { getColor } from '../../../lib/generateChartColor';
import { ConfigContext } from '../ClientContext.client';
const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
});
const HistogramGroupClient = ({ value, dgid }) => {
    const [data, setData] = useState(null);
    const appConfig = useContext(ConfigContext);
    const fetchData = useCallback(async () => {
        const res = await fetch(`${appConfig.apiUrl}histogram`, {
            body: JSON.stringify(value),
            method: 'post',
        });
        const parsed = await res.json();
        setData(parsed);
    }, [value]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const histogramData = useMemo(() => {
        if (!data) return null;
        else
            return [
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
    }, [data]);

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
            },
        };
    }, []);

    const config = useMemo(() => {
        return {
            displayModeBar: false,
        };
    });

    // Verbatim type:
    // {"type": "verbatim", "value": "1011 slug 3s, 1 each", "columnType": "TEXT", "message": "1001 slug 3s not showing"}

    if (data?.type === 'verbatim') {
        return <div className="cell-verbatim">{data.value}</div>;
    } else {
        return (
            <Plot
                style={{ height: '100%', width: '100%', maxHeight: '110px' }}
                data={histogramData}
                layout={layout}
                config={config}
            />
        );
    }
};

export default HistogramGroupClient;
