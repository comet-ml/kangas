import { fetchCategoryNew } from "../../../../lib/fetchCategory"
import CategoryClient from "./CategoryClient";

const Category = async ({ value }) => {
    const data = await fetchCategoryNew(value);

    if (data?.isVerbatim) {
        return (
            <div>{`${data?.value}`}</div>
        )
    }

    return <CategoryClient data={data} />
}

export default Category;