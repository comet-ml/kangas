import fetchCategory from "../../../../lib/fetchCategory"
import CategoryClient from "./CategoryClient";

const Category = async ({ value, expanded }) => {
    const data = await fetchCategory(value);

    if (data?.isVerbatim) {
        return (
            <div>{`${data?.value}`}</div>
        )
    }

    return <CategoryClient data={data} expanded={expanded} title={value?.columnName} query={value} columnName={value?.columnName} />
}

export default Category;
