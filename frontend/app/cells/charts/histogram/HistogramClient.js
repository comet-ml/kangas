'use client';

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { getColor } from '../../../../lib/generateChartColor';
import formatValue from '../../../../lib/formatValue';
const Plot = dynamic(() => import("react-plotly.js"), {
    suspense: true,
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

const HistogramClient = ({ value, expanded, title }) => {
    const [data, setData] = useState();

    useEffect(() => {
        const queryString =new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    ...value,
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();

        fetch(`api/histogram?${queryString}`)
        .then(res => {
            return res.json();
        })
        .then(chart => {
            setData(chart)
        })
    }, [value]);

    const formattedData = useMemo(() => [
        {
            type: 'bar',
            x:
                data?.columnType === 'DATETIME'
                    ? data?.labels?.map((v) => formatValue(v, 'DATETIME'))
                    : data?.labels,
            y: data?.bins,
            text: data?.labels?.map(
                (value) =>
                    `${data?.column}: ${formatValue(
                        value,
                        data?.columnType
                    )} ${data?.message || ''}`
            ),
            marker: { color: getColor(data?.column) },
        },
    ], [data]);


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
        <div className={cx('plotly-container', { expanded })}>
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={formattedData}
                layout={expanded ? ExpandedLayout : HistogramLayout}
                config={HistogramConfig}
            />
        </div>
    )
}

export default HistogramClient;