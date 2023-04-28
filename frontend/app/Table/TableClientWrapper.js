'use client';

import { CircularProgress } from "@mui/material";
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
        return (
            <div>
                <div
                    style={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div >
                        <CircularProgress />
                    </div>
                </div>
                { children }
            </div>
        )
    } else {
        return <>{ children }</>
    }
}

export default TableClientWrapper;