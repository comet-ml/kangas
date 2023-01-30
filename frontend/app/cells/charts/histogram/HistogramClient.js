'use client';

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { getColor } from '../../../../lib/generateChartColor';
import formatValue from '../../../../lib/formatValue';
const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

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
    const [visible, setVisible] = useState(false);
    const plot = useRef();

    const onIntersect = useCallback((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setVisible(true);
            }
        })
    }, []);

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
        }
    }, [title]);

    return (
        <div ref={plot} className={cx('plotly-container', { expanded })}>
            { visible &&
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : HistogramLayout}
                config={HistogramConfig}
            />
}
        </div>
    )
}

export default HistogramClient;
