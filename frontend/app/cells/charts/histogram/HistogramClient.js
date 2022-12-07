'use client';

import Plot from 'react-plotly.js'
import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'

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

const HistogramClient = ({ data }) => {
    return (
        <Plot
            className={cx('plotly-chart')}
            data={data}
            layout={HistogramLayout}
            config={HistogramConfig}
        />
    )
}

export default HistogramClient;