'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import fetchMetadata from '../../../lib/fetchMetadata';
import truncateValue from '../../../lib/truncateValue';
import { ConfigContext } from '../../contexts/ConfigContext';
import { useInView } from "react-intersection-observer";

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

import classNames from 'classnames/bind';
import styles from '../charts/Charts.module.scss';
const cx = classNames.bind(styles);

const Layout = {
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

const Config = {
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
        return <VectorClient {...props} />
    }

    return (
        <div ref={ref}>
            { !visible && <>Loading</> }
            { visible && <VectorClient {...props} /> }
        </div>
    )
}

const VectorClient = ({ value, expanded, ssrData, query }) => {
    const { config } = useContext(ConfigContext);
    const [response, setResponse] = useState();
    const data = useMemo(() => ssrData || response, [ssrData, response]);

    // when single: value is vector
    // when grouped, value is {columnName:"Vector", columnValue: "apple", dgid: "vectors.datagrid",
    //      groupBy: "Category", type: "json-group", whereExpr: null}
    // data is: {Vector: {other: {pca_eigen_vectors: Array(10), pca_mean: Array(100)}}}

    console.log("expanded:", !!expanded);
    console.log("grouped:", !!query?.groupBy);
    console.log("query:", query);
    console.log("data:", data);

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
                    chartType: 'pca',
                    data: JSON.stringify([])
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();
    }, [data]);


    useEffect(() => {
        if (!value || ssrData) return;
	// construct proper query, if grouped, expanded
        fetchMetadata(query).then(res => {
            setResponse(res);
        });
    }, [value])


    if (!data || data?.error) {
        return <>Loading</>
    }

    if (!expanded) {
	// grouped or non-grouped
        return <img src={`${config.rootPath}api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'category'])} />
    }

    return (
        <div style={{ minWidth: '700px', display: 'flex' }}>
            <div className={cx('plotly-container', { expanded })}>
                { data &&
                    <Plot
                        className={cx('plotly-chart', { expanded })}
                        data={data}
                        layout={expanded ? ExpandedLayout : Layout}
                        config={Config}
                    />
                }
            </div>
      </div>
    );
}

export default VisibleWrapper;
