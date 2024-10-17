interface routerType {
    path: string;
    element: JSX.Element;
    head: boolean;
    category: string;
    next: string | null;
    prev: string | null;
}



import { Link } from "react-router-dom";
import Digitals from "./digitals";

import Raytracing from "./raytracing";
import RaytracingBasics from "./raytracing/basics";
import { ReactElement, JSXElementConstructor, ReactNode, useState } from "react";
import RaytracingNiches from "./raytracing/niches";
import Topology from "./topology";

const notesPages: routerType[] = [

    {
        prev: null,

        path: "/notes/raytracing",
        element: <Raytracing/>,
        head: true,
        category: "raytracing",

        next: "/notes/raytracing/basics",
    },
    {
        prev: "/notes/raytracing",

        path: "/notes/raytracing/basics",
        element: <RaytracingBasics/>,
        head: false,
        category: "raytracing",

        next: "/notes/raytracing/niches",
    },
    {
        prev: "/notes/raytracing/basics",

        path: "/notes/raytracing/niches",
        element: <RaytracingNiches/>,
        head: false,
        category: "raytracing",

        next: null,
    },
    {   prev: null,

        path: "/notes/digitals",
        element: <Digitals/>,
        head: true,
        category: "digitals",

        next: null,
    },
    {   
        prev: null,

        path: "/notes/topology",
        element: <Topology/>,
        head: true,
        category: "topology",

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
                <div key={i} style={{marginTop: expanded? undefined : -2 + "vh", transition: "0.5s", opacity: expanded? 1 : 0}}>
                    {subheaders[i]}
                </div>
            )
        }
    }

    return (<div key={header.path} style={{marginTop: "5%", padding: 0, width: "100%"}} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        {headerButton}
        {subHeaderButtons}
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
                    {page.path.substring(("/notes/" + page.category).length + 1)}
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


