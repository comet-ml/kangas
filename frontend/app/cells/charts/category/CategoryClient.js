'use client';

import Plot from 'react-plotly.js'
import classNames from 'classnames/bind';
import { ModalContext } from '../../../modals/DialogueModal/DialogueModalClient';
import styles from '../Charts.module.scss'
import { useContext, useMemo, useCallback } from 'react';
import { useRouter } from "next/navigation";

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


const CategoryClient = ({ data, expanded, title, query, columnName }) => {
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

    return (
        <div className={cx('plotly-container', { expanded })}>
            <Plot
                className={cx('plotly-chart', { expanded })}
                data={data}
                layout={expanded ? ExpandedLayout : CategoryLayout}
                config={CategoryConfig}
                onClick={onClick}
            />
        </div>
    )
}

export default CategoryClient;
