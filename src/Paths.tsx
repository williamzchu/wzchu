import { Link, RouteObject } from "react-router-dom";

const indexes = import.meta.glob('./notes/*/index.tsx')
const buttons: any[] = []
const names: string[] = []
const noteRoutes: RouteObject[] = [] 

for (const path in indexes){
    const noteName = path.substring(8,path.length - 10);
    names.push(noteName)

    buttons.push( 
        <div style={{marginTop: "5%"}}>
            <Link className="nav" to={"notes/" + noteName} >
                {noteName}
            </Link>
        </div>
     );

    noteRoutes.push({path: noteName})
}


export {indexes, buttons, names, noteRoutes}