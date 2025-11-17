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
import { useState } from "react";
import RaytracingIntersections from "./raytracing/intersections"
import Vulkan from "./vulkan";
import Algorithms from "./algorithms"
import AlgorithmsConvexHull from "./algorithms/convexhull"
import Setup from "./vulkan/setup";
import Presentation from "./vulkan/presentation";
import Swapchain from "./vulkan/swapchain";
import Pipeline from "./vulkan/pipeline";
import FramesInFlight from "./vulkan/framesinflight";
import Resizing from "./vulkan/resizing";
import Drawing from "./vulkan/drawing";

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

        next: null,
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

        path: "/notes/vulkan",
        element: <Vulkan/>,
        head: true,
        category: "vulkan",
        title: null,

        next: "/notes/vulkan/setup",
    },

        {   
        prev: "/notes/vulkan",

        path: "/notes/vulkan/setup",
        element: <Setup/>,
        head: false,
        category: "vulkan",
        title: "setup",

        next: "/notes/vulkan/presentation",
    },


    {   
        prev: "/notes/vulkan/setup",

        path: "/notes/vulkan/presentation",
        element: <Presentation/>,
        head: false,
        category: "vulkan",
        title: "Presentation",

        next: "/notes/vulkan/swapchain",
    },

    {   
        prev: "/notes/vulkan/presentation",

        path: "/notes/vulkan/swapchain",
        element: <Swapchain/>,
        head: false,
        category: "vulkan",
        title: "Swap Chain",

        next: "/notes/vulkan/pipeline",
    },

    {   
        prev: "/notes/vulkan/swapchain",

        path: "/notes/vulkan/pipeline",
        element: <Pipeline/>,
        head: false,
        category: "vulkan",
        title: "Pipeline",

        next: "/notes/vulkan/drawing",
    },

    {   
        prev: "/notes/vulkan/pipeline",

        path: "/notes/vulkan/drawing",
        element: <Drawing/>,
        head: false,
        category: "vulkan",
        title: "Drawing",

        next: "/notes/vulkan/framesinflight",
    },

    {   
        prev: "/notes/vulkan/drawing",

        path: "/notes/vulkan/framesinflight",
        element: <FramesInFlight/>,
        head: false,
        category: "vulkan",
        title: "Frames in Flight",

        next: "/notes/vulkan/resizing",
    },
    {   
        prev: "/notes/vulkan/framesinflight",

        path: "/notes/vulkan/resizing",
        element: <Resizing/>,
        head: false,
        category: "vulkan",
        title: "Resizing",

        next: null,
    },

]

function noteButton(header: routerType, subheaders: string | any[], handler: { (arg0: string): void; (arg0: any): void; }){
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


