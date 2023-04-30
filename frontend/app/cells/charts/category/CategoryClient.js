'use client';

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss';
import { useMemo, useCallback, useState, useRef, useEffect, useContext } from 'react';
import { Snackbar } from '@mui/material';
import dynamic from 'next/dynamic';
import useQueryParams from '@kangas/lib/hooks/useQueryParams';
import formatQueryArgs from '@kangas/lib/formatQueryArgs';
import fetchCategory from '@kangas/lib/fetchCategory';
import { ConfigContext } from '@kangas/app/contexts/ConfigContext';
import { useInView } from "react-intersection-observer";

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false,
  });


const cx = classNames.bind(styles);

const CategoryLayout = {
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
    modebar: {
        orientation: 'v',
    },
};

const CategoryConfig = {
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
        return <CategoryClient {...props} />
    }

    return (
        <div ref={ref}>
            { !visible && <>Loading</> }
            { visible && <CategoryClient {...props} /> }
        </div>
    )
}


const CategoryClient = ({ expanded, value, ssrData }) => {
    const { config } = useContext(ConfigContext);
    const [response, setResponse] = useState(false);
    const data = useMemo(() => ssrData || response, [ssrData, response]);
    const [open, setOpen] = useState(false);
    const handleClose = useCallback(() => setOpen(false), []);
    const [message, setMessage] = useState("");

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
                type: 'category'
                },
            modebar: {
                orientation: 'v',
            },
        };
    }, [value?.columnName]);

    const queryString = useMemo(() => {
        if (!data) return;
        return formatQueryArgs({
            chartType: 'category',
            data: JSON.stringify(data)
        });
    }, [data]);

    useEffect(() => {
        setMessage('Clicking on category bar will copy expression to clipboard');
        setOpen(true);
        if (!value || ssrData) return;
        fetchCategory(value).then(res => {
            setResponse(res);
        });
    }, [value, setMessage, setOpen])


    const copyTextToClipboard = async (text) => {
        if ('clipboard' in navigator) {
            return await navigator.clipboard.writeText(text);
        } else {
            return document.execCommand('copy', true, text);
        }
    };

    const onClick = useCallback(async (figure) => {
        if (figure) {
            const text = `{"${value.groupBy}"} == "${value.columnValue}" and {"${value.columnName}"} == '${figure.points[0].label}'`;
            await copyTextToClipboard(text);
            setMessage(`Copied expression to clipboard`);
            setOpen(true);
        }
    }, [value, setMessage, setOpen]);


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
        <div className={cx('plotly-container', { expanded })}>
            { data &&
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : CategoryLayout}
                config={CategoryConfig}
                onClick={onClick}
            />
            }
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
