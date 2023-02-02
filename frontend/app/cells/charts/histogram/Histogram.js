import fetchHistogram from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";
import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'

const cx = classNames.bind(styles);

const Histogram = async ({ value, expanded }) => {
    const data = await fetchHistogram(value);

    if (data?.isVerbatim) {
        return <>Verbatim</>
    } else if (!expanded) {
        // FIXME: only pass enough of data to make thumbnail image
        const queryString =new URLSearchParams(
            Object.fromEntries(
                Object.entries({
                    chartType: 'histogram',
                    data: JSON.stringify(data)
                }).filter(([k, v]) => typeof(v) !== 'undefined' && v !== null)
            )
        ).toString();

        return (
            <img src={`/api/charts?${queryString}`} loading="lazy" className={cx(['chart-thumbnail', 'category'])} />
        );
    } else {
        return (<HistogramClient expanded={expanded} title={value?.columnName} query={value} data={data} />);
    }
}

export default Histogram;
