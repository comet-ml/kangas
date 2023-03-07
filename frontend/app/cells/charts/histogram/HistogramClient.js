'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import { getColor } from '../../../../lib/generateChartColor';
import formatValue from '../../../../lib/formatValue';
import truncateValue from '../../../../lib/truncateValue';
import { ConfigContext } from '../../../contexts/ConfigContext';

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss';
import useQueryParams from '../../../../lib/hooks/useQueryParams';
const cx = classNames.bind(styles);

const HistogramLayout = {
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

const HistogramConfig = {
    displayModeBar: false,
};

const HistogramClient = ({ value, expanded, title, data }) => {
    const { params, updateParams } = useQueryParams();
    const { config } = useContext(ConfigContext);
    const [visible, setVisible] = useState(false);
    const plot = useRef();

    const onIntersect = useCallback((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setVisible(true);
            }
        });
    }, []);

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
                                ).toLocaleString(config.locale)}
                            </ul>
                        );
                    })}
                </div>
            );
        }
        return <div />;
    };

    const statisticsTable = useMemo(() => {
        if (typeof(data) !== 'undefined' && Array.isArray(data) && data[0].statistics) {
            return makeStatsTable(data[0].statistics);
        }
        return <div />;
    }, [data]);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0
        };

        const observer = new IntersectionObserver(onIntersect, options);
        observer.observe(plot.current);

    }, [onIntersect]);

    const ExpandedLayout = useMemo(() => {
        return {
            autosize: true,
            title,
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
            }
        };
    }, [title]);

    useEffect(() => {
        if (data?.error) {
            const time = Date.now();
            updateParams({
                last: time
            })
        }
    }, [data?.error, updateParams]);


    return (
      <div style={{ minWidth: '700px', display: 'flex' }}>
        <div ref={plot} className={cx('plotly-container-with-stats', { expanded })}>
            { visible &&
            <Plot
                className={cx('plotly-chart-with-stats', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : HistogramLayout}
                config={HistogramConfig}
            />
}
        </div>
        {statisticsTable}
      </div>
    );
}

export default HistogramClient;
