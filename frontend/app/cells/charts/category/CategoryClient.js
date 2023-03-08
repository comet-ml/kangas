'use client';

import classNames from 'classnames/bind';
import styles from '../Charts.module.scss';
import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useQueryParams from '../../../../lib/hooks/useQueryParams';
import fetchCategory from '../../../../lib/fetchCategory';
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
};

const CategoryConfig = {
    displayModeBar: false,
};


const CategoryClient = ({ expanded, value, ssrData }) => {
    const { params, updateParams } = useQueryParams();
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState(false);
    const plot = useRef();
    const { ref, inView, entry } = useInView({
        threshold: 0,
    });

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
        };
    }, [value?.columnName]);

    const queryString = useMemo(() => {
        if (!data) return;
        return new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    chartType: 'category',
                    data: JSON.stringify(data)
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();
    }, [data]);

    useEffect(() => {
        if (!value || ssrData) return;
        fetchCategory(value).then(res => {
            setData(res);
        });
    }, [value])

    useEffect(() => {
        if (ssrData) setData(ssrData);
    }, [ssrData]);

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
        <div ref={ref} className={cx('plotly-container', { expanded })}>
            { inView && data &&
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : CategoryLayout}
                config={CategoryConfig}
            />
            }
        </div>
    );
}

export default CategoryClient;
