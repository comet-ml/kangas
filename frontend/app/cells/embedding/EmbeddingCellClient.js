'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import { ConfigContext } from '../../contexts/ConfigContext';
import { useInView } from "react-intersection-observer";
import fetchEmbeddingsAsPCA from '../../../lib/fetchEmbeddingsAsPCA';

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

import classNames from 'classnames/bind';
import styles from '../charts/Charts.module.scss';
const cx = classNames.bind(styles);

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
        return <EmbeddingClient {...props} />
    }

    return (
        <div ref={ref}>
            { !visible && <>Loading</> }
            { visible && <EmbeddingClient {...props} /> }
        </div>
    )
}

const EmbeddingClient = ({ value, expanded, query, columnName, ssrData }) => {
    const [response, setResponse] = useState();
    const data = useMemo(() => ssrData || response, [ssrData, response]);
    const { config } = useContext(ConfigContext);

    const Layout = useMemo(() => {
        return {
            title: columnName,
	    dragmode: 'lasso',
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
		range: [ -3, 3 ]
            },
            yaxis: {
                font: {
                    size: 13,
                    color: '#3D4355',
                },
		range: [ -3, 3 ]
            }
        };
    }, [columnName]);


    useEffect(() => {
        if (!value || ssrData || !query) return;

	if (!query?.groupBy) {
	    fetchEmbeddingsAsPCA({dgid: query?.dgid, timestamp: query?.timestamp, columnName, assetId: value?.assetId}).then(res => {
		setResponse(res);
	    });
	} else {
            fetchEmbeddingsAsPCA({dgid: query?.dgid, timestamp: query?.timestamp, columnName, columnValue: value?.columnValue,
				  groupBy: value?.groupBy, whereExpr: value?.whereExpr}).then(res => {
				      setResponse(res);
				  });
	}
    }, [value, query, ssrData]);


    const queryString = useMemo(() => {
        if (!data) return;

        return new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    chartType: 'scatter',
                    data: JSON.stringify(data)
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();
    }, [data]);


    if (!data || data?.error) {
        return <>Loading</>
    }

    if (!expanded) {
	if (!query?.groupBy) {
            return (<img src={`${config.rootPath}api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'embedding'])} />);
	} else {
            return (<img src={`${config.rootPath}api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'embedding-grouped'])} />);
	}
    }

    return (
        <div style={{ minWidth: '700px', display: 'flex' }}>
            <div className={cx('plotly-container', { expanded })}>
                { data &&
                    <Plot
                        className={cx('plotly-chart', { expanded })}
                        data={data}
                        layout={Layout}
                        config={Config}
                    />
                }
            </div>
      </div>
    );
}

export default VisibleWrapper;
