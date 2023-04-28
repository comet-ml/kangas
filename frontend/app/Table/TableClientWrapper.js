'use client';

import { useContext, useEffect, useRef } from "react"
import { ViewContext } from "../contexts/ViewContext"

const TableClientWrapper = ({ data, children }) => {
    const { isLoading, completeLoading } = useContext(ViewContext);
    const prevData = useRef();

    useEffect(() => {
        if (data !== prevData?.current) {
            prevData.current = data
            if (isLoading) completeLoading();
        }
    }, [data, completeLoading, isLoading]);

    if (isLoading) {
        return <>Loading</>
    } else {
        return <>{ children }</>
    }
}

export default TableClientWrapper;