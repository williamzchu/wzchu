import { Canvas, useThree } from "@react-three/fiber"
import Background from "./Background"
import { useState } from "react"
import { shapeContext } from "./ShapeContext"
import { createBrowserRouter, RouterProvider, Link, Outlet } from "react-router-dom"

export default function Experience(){

    const [shape, setShape] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [repeater, setRepeater] = useState<NodeJS.Timeout>()
    
    function hover(shape: number){
        const t = performance.now()
        if (t- hoverTime > 600){
            setShape(shape)
            //console.log(shape)
            setHoverTime(t)
        }
    }

    return <>
        <shapeContext.Provider value={shape}>
            <Canvas>
                <Background/>
            </Canvas>
        <div className="navbar">
                <Link className="nav" to="/about">
                    <div className="navtext" onMouseOver={() => setRepeater(setInterval(() => hover(2), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>1</div>
                </Link>
                <Link className="nav" to="/">
                    <div className="navtext" onMouseOver={() => setRepeater(setInterval(() => hover(0), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>2</div>
                </Link>
                <Link className="nav" to="/notes" >
                    <div className="navtext" onMouseOver={() => setRepeater(setInterval(() => hover(1), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>3</div>
                </Link>
        </div>
        <div className="content">
            <Outlet/>
        </div>
        </shapeContext.Provider>
    </>
}