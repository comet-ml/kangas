'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import fetchHistogram from "../../../../lib/fetchHistogram"
import truncateValue from '../../../../lib/truncateValue';
import { ConfigContext } from '../../../contexts/ConfigContext';
import { useInView } from "react-intersection-observer";

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

const HistogramClient = ({ value, expanded, ssrData }) => {
    const { config } = useContext(ConfigContext);
    const [data, setData] = useState();
    const { ref, inView, entry } = useInView({
        threshold: 0,
    });

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
        if (!!data?.[0]?.statistics) {
            return makeStatsTable(data[0].statistics);
        }
        return <div />;
    }, [data]);

    const ExpandedLayout = useMemo(() => {
        return {
            autosize: true,
            title: value?.columnName,
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
    }, [value?.columnName]);

    const queryString = useMemo(() => {
        if (!data) return;

        return new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    chartType: 'histogram',
                    data: JSON.stringify(data)
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();
    }, [data]);


    useEffect(() => {
        if (!value || ssrData) return;
        fetchHistogram(value).then(res => {
            setData(res);
        });
    }, [value])

    useEffect(() => {
        if (ssrData) setData(ssrData);
    }, [ssrData]);

    /*
    useEffect(() => {
        if (data?.error) {
            const time = Date.now();
            setTimeout(() => {
                updateParams({
                    last: time
                })
            }, 800)
        }
    }, [data?.error, updateParams]);*/

    if (!data || data?.error) {
        return <> Loading </>
    }

    if (data?.isVerbatim) {
        return <div> { data?.value } </div>
    }

    if (!expanded) {
        return <img src={`/api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'category'])} />
    }

    return (
        <div style={{ minWidth: '700px', display: 'flex' }}>
            <div ref={ref} className={cx('plotly-container-with-stats', { expanded })}>
                { inView && data &&
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
