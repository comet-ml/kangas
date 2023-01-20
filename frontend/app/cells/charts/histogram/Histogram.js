import fetchHistogram from "../../../../lib/fetchHistogram"
import HistogramClient from "./HistogramClient";

const Histogram = async ({ value, expanded }) => {

    return <HistogramClient value={value} expanded={expanded} title={value?.columnName} />
}

export default Histogram;