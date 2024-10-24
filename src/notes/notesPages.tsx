interface routerType {
    path: string;
    element: JSX.Element;
    head: boolean;
    category: string;
    next: string | null;
    prev: string | null;
    title: string | null;
}



import { Link } from "react-router-dom";
import Digitals from "./digitals";

import Raytracing from "./raytracing";
import RaytracingBasics from "./raytracing/basics";
import { ReactElement, JSXElementConstructor, ReactNode, useState } from "react";
import RaytracingIntersections from "./raytracing/intersections"
import Topology from "./topology";
import Algorithms from "./algorithms"
import AlgorithmsVoronoi from "./algorithms/voronoi";
import AlgorithmsConvexHull from "./algorithms/convexhull"

const notesPages: routerType[] = [

    {
        prev: null,

        path: "/notes/raytracing",
        element: <Raytracing/>,
        head: true,
        category: "raytracing",
        title: null,

        next: "/notes/raytracing/basics",
    },
    {
        prev: "/notes/raytracing",

        path: "/notes/raytracing/basics",
        element: <RaytracingBasics/>,
        head: false,
        category: "raytracing",
        title: null,

        next: "/notes/raytracing/intersections",
    },
    {
        prev: "/notes/raytracing/basics",

        path: "/notes/raytracing/intersections",
        element: <RaytracingIntersections/>,
        head: false,
        category: "raytracing",
        title: null,

        next: "/notes/raytracing/unitvectors",
    },

    {
        prev: null,

        path: "/notes/algorithms",
        element: <Algorithms/>,
        head: true,
        category: "algorithms",
        title: null,

        next: "/notes/algorithms/convexhull",
    },

    {
        prev: null,

        path: "/notes/algorithms/convexhull",
        element: <AlgorithmsConvexHull/>,
        head: false,
        category: "algorithms",
        title: "Convex Hull",

        next: "/notes/algorithms/voronoi",
    },

    {
        prev: "/notes/algorithms/convexhull",

        path: "/notes/algorithms/voronoi",
        element: <AlgorithmsVoronoi/>,
        head: false,
        category: "algorithms",
        title: null,

        next: null,
    },

    {   
        prev: null,

        path: "/notes/digitals",
        element: <Digitals/>,
        head: true,
        category: "digitals",
        title: null,

        next: null,
    },

    {   
        prev: null,

        path: "/notes/topology",
        element: <Topology/>,
        head: true,
        category: "topology",
        title: null,

        next: null,
    },
]

function noteButton(header, subheaders, handler){
    const [expanded, setExpanded] = useState(false)

    const headerButton = 
        <Link className="nav" to={header.path} onClick={() => handler(header.path)} style={{padding: 0}}>
            {header.path.substring("/notes/".length)}
        </Link>
    
    const subHeaderButtons = []

    if (subheaders){
        for (let i = 0; i < subheaders.length; i++){
            subHeaderButtons.push(
                <div key={i} style={{marginTop: expanded? "0" : "-3.3%", transition: "0.5s", opacity: expanded? 1 : 0}}>
                    {subheaders[i]}
                </div>
            )
        }
    }

    return (<div key={header.path} style={{marginTop: "5%", padding: 0, width: "100%"}} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        {headerButton}
        <div>
            {subHeaderButtons}
        </div>
        </div>)
}

function buttons(handler: (arg0: string) => void){
    const headers = []
    const subheaders = new Map()
    for (let i = 0; i < notesPages.length; i++){
        const page = notesPages[i]
        if (!page.head){
            if (!subheaders.has(page.category)){
                subheaders.set(page.category, [])
            }
            subheaders.get(page.category).push(
                <Link className="nav" to={page.path} onClick={() => handler(page.path)}>
                    {page.title? page.title : page.path.substring(("/notes/" + page.category).length + 1)}
                </Link>
            )
        }
    }

    for (let i = 0; i < notesPages.length; i++){
        const page = notesPages[i]
        //console.log(page.category)
        //console.log(subheaders)
        if (page.head){
            headers.push( noteButton(page, subheaders.get(page.category), handler) )
        }
    }
    return headers
}

const noteMap = new Map()

for (let i = 0; i < notesPages.length; i++){
    const page = notesPages[i]
    noteMap.set(page.path, page)
}
//console.log(buttons)
export default notesPages;

export {buttons, noteMap};


