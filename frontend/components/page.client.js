import { StyledEngineProvider } from "@mui/material"

const Page = ({ children }) => {
    return (
	    <>
            <div className="main">
                    <div className="page">{children}</div>        
            </div>
        </>
    );
}

export default Page;