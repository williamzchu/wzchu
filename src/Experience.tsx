import { Canvas, useThree } from "@react-three/fiber"
import Background from "./Background"
import { useEffect, useRef, useState } from "react"
import { shapeContext } from "./ShapeContext"
import { selectedContext } from "./SelectedContext"
import { Link, useLocation } from "react-router-dom"
import About from "./About"
import Notes from "./Notes"

export default function Experience(){

    const [shape, setShape] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [repeater, setRepeater] = useState<NodeJS.Timeout>()
    const [selected, setSelected] = useState(0)
    const [contentY, setContentY] = useState(0)
    const location = useLocation()
    
    const navRef = useRef(null)
    const aboutRef = useRef(null)
    const notesRef = useRef(null)
    
    function hover(shape: number){
        const t = performance.now()
        if (t- hoverTime > 600){
            setShape(shape)
            //console.log(shape)
            setHoverTime(t)
        }
    }

    if (navRef.current && aboutRef.current && notesRef.current){
        const top = 0
        const textHeight = selected == 1? aboutRef.current.clientHeight : notesRef.current.clientHeight
        const bottom = -textHeight + window.innerHeight
        document.onwheel = (event) => {setContentY(Math.min(top,Math.max(bottom, contentY - event.deltaY)))}
    }
    
    useEffect(
        () => {
            if (location.pathname == "/about"){
                setSelected(1)
            }
            else if (location.pathname == "/notes"){
                setSelected(2)
            }
            else {
                setSelected(0)
            }
            console.log(location)
        }, [location]
    )

    const navbar = (<>
        <div>
        <Link ref={navRef} className="nav" to="/about" onClick={() => {setSelected(1); setContentY(0)} } onMouseOver={() => setRepeater(setInterval(() => hover(1), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
            ABOUT
        </Link>
        </div>
        <div>
        <Link ref={navRef} className="nav" to="/" onClick={() => setSelected(0)} onMouseOver={() => setRepeater(setInterval(() => hover(0), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
            HOME
        </Link>
        </div>
        <div>
        <Link ref={navRef} className="nav" to="/notes" onClick={() => {setSelected(2); setContentY(0)}} onMouseOver={() => setRepeater(setInterval(() => hover(2), 5))} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
            NOTES
        </Link>
        </div></>)
    let l = 0
    if (selected != 0){
        l = 25
    }
    let w = 100
    if (selected){
        w = 50
    }
    return <>
        <selectedContext.Provider value={selected}>
            <shapeContext.Provider value={shape}>
                <Canvas style={{transition: '2s', left: l + "vw"}}>
                    <Background/>
                </Canvas>
                <div className="leftblur" style={{left: (l - 25)*4+ "vw"}}/>
                <div ref={aboutRef} className="content" style={{top: contentY, left: (selected == 1?0: -100) +  "vw"}}>
                    <div className="content-container">
                        <About/>
                    </div>
                </div>
                <div ref={notesRef} className="content" style={{top: contentY, left: (selected == 2?0: -100) +  "vw"}}>
                    <div className="content-container">
                        <Notes/>
                    </div>
                </div>
                <div style={{top: selected != 0? '2vh': '90vh', width: w + "vw", left: 100 - w + "vw"}} className="navbar" ref={navRef}>
                    {navbar}
                </div>
            </shapeContext.Provider>

        </selectedContext.Provider>
    </>
}