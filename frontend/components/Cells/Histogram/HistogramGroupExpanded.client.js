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
import truncateValue from '../../../lib/truncateValue';
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

    // TODO Clean this up as a subcomponent
    const makeStatsTable = (statistics) => {
        if (statistics) {
            return (
                <div style={{ margin: 'auto', marginLeft: 'inherit' }}>
                    {Object.keys(statistics).map((key, index) => {
                        return (
                            <ul style={{ paddingLeft: '0' }}>
                                <b>{key}</b> :{' '}
                                {truncateValue(
                                    statistics[key],
                                    3
                                ).toLocaleString(appConfig.locale)}
                            </ul>
                        );
                    })}
                </div>
            );
        }
        return <div />;
    };

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

    const statisticsTable = useMemo(() => {
        if (!data?.statistics) return <div />;
        return makeStatsTable(data.statistics);
    }, [data]);

    const layout = useMemo(() => {
        return {
            autosize: true,
            title: `${data?.column}`,
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
                font: {
                    size: 13,
                    color: '#3D4355',
                },
            },
        };
    }, [data]);

    const plotlyConfig = useMemo(() => {
        return {
            displayModeBar: false,
        };
    });

    // Verbatim type:
    // {"type": "verbatim", "value": "1011 slug 3s, 1 each", "columnType": "TEXT", "message": "1001 slug 3s not showing"}

    if (data?.type === 'verbatim') {
        return <div className="cell-verbatim-expanded">{data.value}</div>;
    } else {
        return (
            <div style={{ minWidth: '600px', display: 'flex' }}>
                <Plot
                    style={{ height: '100%', width: '75%' }}
                    data={histogramData}
                    layout={layout}
                    config={plotlyConfig}
                />
                {statisticsTable}
            </div>
        );
    }
};

export default HistogramGroupClient;
