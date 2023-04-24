'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import { ConfigContext } from '../../contexts/ConfigContext';
import { useInView } from "react-intersection-observer";
import fetchEmbeddingsAsPCA from '../../../lib/fetchEmbeddingsAsPCA';
import formatQueryArgs from '../../../lib/formatQueryArgs';

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false
  });

import classNames from 'classnames/bind';
import styles from '../charts/Charts.module.scss';
const cx = classNames.bind(styles);

const Config = {
    displayModeBar: true,
    showAxisDragHandles: false,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d'],
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
    }, [hasRendered]);

    useEffect(() => {
        /*
        if (!inView && !timeout.current) {
            timeout.current = setTimeout(render, 50)
        }
        */

        if (inView && !hasRendered) {
            render();
        }
    }, [inView, render, hasRendered]);



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
                size: 12,
                color: '#191A1C',
            },
            xaxis: {
                font: {
                    size: 8,
                    color: '#3D4355',
                },
            },
            yaxis: {
                font: {
                    size: 8,
                    color: '#3D4355',
                },
            },
            modebar: {
                orientation: 'v',
            },
        };
    }, [columnName]);


    const queryParams = useMemo(() => {
        if (!query?.groupBy) {
            return {
                dgid: query?.dgid,
                timestamp: query?.timestamp,
                columnName,
                assetId: value?.assetId,
                computedColumns: query?.computedColumns,
                whereExpr: value?.whereExpr
            };
        } else {
            return {
                dgid: query?.dgid,
                timestamp: query?.timestamp,
                columnName,
                columnValue: value?.columnValue,
                groupBy: query?.groupBy,
                computedColumns: query?.computedColumns,
                whereExpr: query?.whereExpr
            };
        }
    }, [query, value, columnName]);

    useEffect(() => {
        if (ssrData || !queryParams) return;

        fetchEmbeddingsAsPCA(queryParams).then(res => {
            setResponse(res);
        });
    }, [ssrData, queryParams]);


    const queryString = useMemo(() => {
        if (!query?.dgid) return;

        return formatQueryArgs({
            ...queryParams,
            thumbnail: true
        });
    }, [queryParams]);


    if (!data || data?.error) {
        return <>Loading</>
    }

    if (!expanded) {
        if (!query?.groupBy) {
            return (
                <img
                    src={`${config.rootPath}api/embeddings-as-pca?${queryString}`}
                    loading="lazy"
                    className={cx(['chart-thumbnail', 'embedding'])}
                />
            );
        } else {
            return (
                <img
                    src={`${config.rootPath}api/embeddings-as-pca?${queryString}`}
                    loading="lazy"
                    className={cx(['chart-thumbnail', 'embedding-grouped'])}
                />
            );
        }
    }

    const copyTextToClipboard = async (text) => {
	if ('clipboard' in navigator) {
	    return await navigator.clipboard.writeText(text);
	} else {
	    return document.execCommand('copy', true, text);
	}
    };

    const onSelected = async (figure) => {
	if (figure) {
	    const text = figure.points.map(point => `${point.customdata}`).join(",");
	    await copyTextToClipboard(text);
	}
    };

    return (
            <div className={cx('plotly-scatter-container', { expanded })}>
                { data &&
                    <Plot
                        className={cx('plotly-scatter-chart', { expanded })}
                        data={data}
                        layout={Layout}
                        config={Config}
		        onSelected={onSelected}
                    />
                }
            </div>
    );
};

export default VisibleWrapper;
