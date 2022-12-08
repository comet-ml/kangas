import { fetchHistogramNew } from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";

const Histogram = async ({ value, expanded }) => {
    const data = await fetchHistogramNew(value);
    
    if (data?.isVerbatim) {
        return (
            <div>{`${data?.value}`}</div>
        )
    }

    return <HistogramClient data={data} expanded={expanded} />
}

export default Histogram;