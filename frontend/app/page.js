import config from '../config';

const getMatrices = async (query) => {
    const res = await fetch(`${config.apiUrl}list`)
    return res.json();
}

const Page = async ({ searchParams }) => {
    const { 
        dgid,
        filter,
        groupBy,
        sortBy,
        sortDesc 
    } = searchParams;

    const data = await getMatrices('null');

    console.log(searchParams);
    console.log(data)

    return (
        <div>Hello</div>
    )
}