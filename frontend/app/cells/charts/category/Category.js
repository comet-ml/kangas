import fetchCategory from "@kangas/lib/fetchCategory"
import CategoryClient from './CategoryClient';

const Category = async ({ query, value, expanded, ssr }) => {
    const ssrData = ssr ? await fetchCategory(value, ssr) : false;

    return (
        <CategoryClient
            query={query}
            expanded={expanded}
            value={value}
            ssrData={ssrData}
        />
    )
}

export default Category;
