import fetchCategory from "../../../../lib/fetchCategory"
import CategoryClient from "./CategoryClient";

const Category = async ({ value, expanded }) => {
    return <CategoryClient expanded={expanded} title={value?.columnName} query={value} columnName={value?.columnName} />
}

export default Category;
