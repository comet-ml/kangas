import { StyledEngineProvider } from "@mui/material"

const Page = ({ children }) => {
    return (
        <StyledEngineProvider injectFirst>
            <div className="main">
                    <div className="page">{children}</div>        
            </div>
        </StyledEngineProvider>
    );
}

export default Page;