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

const VisibleWrapper = (props) => {
    const { ref, inView, entry } = useInView({
        threshold: 0,
    });
    const timeout = useRef();

    const [hasRendered, setHasRendered] = useState(false);
    const visible = useMemo(() => hasRendered || inView, [hasRendered, inView]);
    const render = useCallback(() => {
        if (!hasRendered) setHasRendered(true)
    }, [hasRendered])

    useEffect(() => {
        /*
        if (!inView && !timeout.current) {
            timeout.current = setTimeout(render, 50)
        }
        */

        if (inView && !hasRendered) {
            render();
        }
    }, [inView, render, hasRendered])



    if (!!props?.ssrData) {
        return <HistogramClient {...props} />
    }

    return (
        <div ref={ref}>
            { !visible && <>Loading</> }
            { visible && <HistogramClient {...props} /> }
        </div>
    )
}


const HistogramClient = ({ value, expanded, ssrData }) => {
    const { config } = useContext(ConfigContext);
    const [response, setResponse] = useState();
    const data = useMemo(() => ssrData || response, [ssrData, response]);

    const statistics = useMemo(() => {
        return data?.[0]?.statistics
    }, [data?.[0]?.statistics]);

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
            setResponse(res);
        });
    }, [value])


    if (!data || data?.error) {
        return <>Loading</>
    }

    if (data?.isVerbatim) {
        return <div> { data?.value } </div>
    }

    if (!expanded) {
        return <img src={`${config.rootPath}api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'category'])} />
    }

    return (
        <div style={{ minWidth: '700px', display: 'flex' }}>
            <div className={cx('plotly-container-with-stats', { expanded })}>
                { data &&
                    <Plot
                        className={cx('plotly-chart-with-stats', { expanded })}
                        data={data}
                        layout={expanded ? ExpandedLayout : HistogramLayout}
                        config={HistogramConfig}
                    />
                }
            </div>
            { !!statistics && (
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
            )}
      </div>
    );
}

export default VisibleWrapper;
