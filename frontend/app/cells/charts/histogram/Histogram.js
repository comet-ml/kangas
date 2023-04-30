import fetchHistogram from "@kangas/lib/fetchHistogram"
import HistogramClient from "./HistogramClient";

const Histogram = async ({ value, expanded, ssr }) => {
    const ssrData = ssr ? await fetchHistogram(value, ssr) : false;

    return <HistogramClient expanded={expanded} value={value} ssrData={ssrData} />;
}

export default Histogram;
