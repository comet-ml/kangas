'use client';

import classNames from 'classnames/bind';
import { ModalContext } from '../../../modals/DialogueModal/DialogueModalClient';
import styles from '../Charts.module.scss';
import { useContext, useMemo, useCallback, useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { getColor } from '../../../../lib/generateChartColor';
import useQueryParams from '../../../../lib/hooks/useQueryParams';

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


const CategoryClient = ({ expanded, title, query, columnName, data }) => {
    const { params, updateParams } = useQueryParams();
    const [visible, setVisible] = useState(false);
    const plot = useRef();

    const onIntersect = useCallback((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setVisible(true);
            }
        });
    }, []);

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
                type: 'category'
	        },
        };
    }, [title]);

    const router = useRouter();

    /*
    const onClick = useCallback((data) => {
        // FIXME: this doesn't stop the event:
        data.event.preventDefault();
        data.event.stopPropagation();

        let filter = `{"${query.groupBy}"} == "${query.columnValue}" and {"${columnName}"} == "${data.points[0].label}"`;
        //FIXME: may repeat items:
        if (!!query.filter)
            filter = `${query.filter} and ${filter}`;

        // FIXME: build query string and encode:
        router.push(`/?datagrid=${query.dgid}&filter=${filter}`);
    }, [data, columnName]);
    */

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0
        };

        const observer = new IntersectionObserver(onIntersect, options);
        observer.observe(plot.current);

    }, [onIntersect]);

    useEffect(() => {
        if (data?.error) {
            const time = Date.now();
            updateParams({
                last: time
            })
        }
    }, [data?.error, updateParams]);

    return (
        <div ref={plot} className={cx('plotly-container', { expanded })}>
            { visible &&
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : CategoryLayout}
                config={CategoryConfig}
            />
            }
        </div>
    );
    // onClick={onClick}
}

export default CategoryClient;
