import fetchHistogram from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";
import classNames from 'classnames/bind';
import styles from '../Charts.module.scss'

const cx = classNames.bind(styles);

const Histogram = async ({ value, expanded, ssr }) => {
    const ssrData = ssr ? await fetchHistogram(value, ssr) : false; 
    
    return <HistogramClient expanded={expanded} value={value} ssrData={ssrData} />;
    
}

export default Histogram;
