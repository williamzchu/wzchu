interface routerType {
    path: string;
    element: JSX.Element;
    head: boolean;
}



import { Link } from "react-router-dom";
import Digitals from "./digitals";

import Raytracing from "./raytracing";
import RaytracingBasics from "./raytracing/basics";

const notesPages: routerType[] = [
    {
        path: "/notes/digitals",
        element: <Digitals/>,
        head: true
    },

    {
        path: "/notes/raytracing",
        element: <Raytracing/>,
        head: true
    },
    {
        path: "/notes/raytracing/basics",
        element: <RaytracingBasics/>,
        head: false
    },
]

const noteMap = new Map()
const buttons = []
for (let i = 0; i < notesPages.length; i++){
    const page = notesPages[i]
    console.log(page)
    if (page.head){
        buttons.push(
            <div key={page.path} style={{marginTop: "5%"}}>
            <Link className="nav" to={page.path} >
                {page.path.substring("/notes/".length)}
            </Link>
            </div>
        )
    }

    noteMap.set(page.path, page.element)
}
//console.log(buttons)
export default notesPages;

export {buttons, noteMap};


