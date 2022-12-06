import Category from "../charts/category/Category";

const GroupedTextCell = ({ value }) => {
    return (
        <div className="cell-content">
            <Category value={value} />
        </div>
    )
}

export default GroupedTextCell;