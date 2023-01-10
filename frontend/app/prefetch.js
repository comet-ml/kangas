import fetchDataGrid from "../lib/fetchDatagrid";
import fetchDatagrids from "../lib/fetchDatagrids"

const Prefetch = async ({ datagrids }) => {
    for (const dgid of datagrids) {
        console.log(`trying ${dgid.value}`)
        try {
            const temp = await fetchDataGrid({ dgid: dgid.value })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <></>
    )
}

export default Prefetch;