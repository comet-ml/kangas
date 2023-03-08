import fetchCategory from "../../../../lib/fetchCategory"
import CategoryClient from './CategoryClient';

const Category = async ({ value, expanded, ssr }) => {
    const ssrData = ssr ? await fetchCategory(value, ssr) : false; 

    return (
        <CategoryClient 
            expanded={expanded}
            value={value}
            ssrData={ssrData}
        />
    )
}

export default Category;
