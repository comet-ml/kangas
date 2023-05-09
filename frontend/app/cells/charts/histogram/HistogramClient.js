'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import { Snackbar } from '@mui/material';
import dynamic from 'next/dynamic';
import fetchHistogram from "@kangas/lib/fetchHistogram"
import formatQueryArgs from '@kangas/lib/formatQueryArgs';
import truncateValue from '@kangas/lib/truncateValue';
import { ConfigContext } from '@kangas/app/contexts/ConfigContext';
import { useInView } from "react-intersection-observer";

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';
import { ViewContext } from '@kangas/app/contexts/ViewContext';
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
    modebar: {
        orientation: 'v',
    },
};

const HistogramConfig = {
    displayModeBar: true,
    showAxisDragHandles: false,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
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
    const { query } = useContext(ViewContext);
    const [response, setResponse] = useState();
    const data = useMemo(() => ssrData || response, [ssrData, response]);
    const [open, setOpen] = useState(false);
    const handleClose = useCallback(() => setOpen(false), []);
    const [message, setMessage] = useState("");

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
            },
            modebar: {
                orientation: 'v',
            },
        };
    }, [value?.columnName]);

    const queryString = useMemo(() => {
        if (!data) return;

        return formatQueryArgs({
            chartType: 'histogram',
            data: JSON.stringify(data),
            timestamp: query?.timestamp
        });
    }, [data, query?.timestamp]);


    useEffect(() => {
        setMessage('Clicking on histogram bar will copy expression to clipboard');
        setOpen(true);
        if (!value || ssrData) return;
        fetchHistogram(value).then(res => {
            setResponse(res);
        });
    }, [value])


    const copyTextToClipboard = async (text) => {
        if ('clipboard' in navigator) {
            return await navigator.clipboard.writeText(text);
        } else {
            return document.execCommand('copy', true, text);
        }
    };

    const onClick = useCallback(async (figure) => {
        if (figure) {
            const delta = figure.points[0].data.x[1]  - figure.points[0].data.x[0];
            const max = figure.points[0].data.x[figure.points[0].pointIndex] + delta;
            const min = figure.points[0].data.x[figure.points[0].pointIndex];
            const text = `{"${value.groupBy}"} == "${value.columnValue}" and ${min} < {"${value.columnName}"} < ${max}`;
            await copyTextToClipboard(text);
            setMessage(`Copied expression to clipboard`);
            setOpen(true);
        }
    }, [value]);

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
                        onClick={onClick}
                    />
                }
            </div>
            { !!statistics && (
                    <div style={{ margin: 'auto', marginLeft: '50px', width: '200px' }}>
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
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                message={message}
            />
      </div>
    );
}

export default VisibleWrapper;
