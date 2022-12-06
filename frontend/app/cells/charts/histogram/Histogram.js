import { fetchHistogramNew } from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";

const Histogram = async ({ value }) => {
    const data = await fetchHistogramNew(value);
    return <HistogramClient data={data} />
}

export default Histogram;