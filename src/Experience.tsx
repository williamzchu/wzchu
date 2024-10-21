import { Canvas, useThree } from "@react-three/fiber"
import Background from "./Background"
import { cloneElement, SetStateAction, useEffect, useRef, useState } from "react"
import { shapeContext } from "./ShapeContext"
import { selectedContext } from "./SelectedContext"
import { Link, Outlet, useLocation, useOutlet } from "react-router-dom"
import About from "./About"
import Notes from "./Notes"
import { AnimatePresence } from "framer-motion"
import { buttons } from "./notes/notesPages"


export default function Experience(){

    const [shape, setShape] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [repeater, setRepeater] = useState<NodeJS.Timeout>()
    const [selected, setSelected] = useState(0)
    const [noteSelection, setNoteSelection] = useState("")
    const [contentY, setContentY] = useState(0)
    const location = useLocation()
    
    const navRef = useRef(null)
    const aboutRef = useRef(null)
    const notesRef = useRef(null)
    const contentRef = useRef(null)

    const noteContent = location.pathname.substring('/notes'.length).length != 0
    
    function hover(shape: number){
        const t = performance.now()
        if (t- hoverTime > 600){
            setShape(shape)
            //console.log(shape)
            setHoverTime(t)
        }
    }

    function selectNote(s: SetStateAction<string>){
        setNoteSelection(s)
        setContentY(0)
    }

    if (navRef.current && aboutRef.current && contentRef.current){
        const top = 0
        const textHeight = selected == 1? aboutRef.current.clientHeight : contentRef.current.clientHeight
        const bottom = -textHeight + window.innerHeight
        document.onwheel = (event) => {setContentY(Math.min(top,Math.max(bottom, contentY - event.deltaY)))}
        //console.log("height" + contentRef.current.clientHeight)
    }
    //let notes = selected == 2 //&& location.pathname.substring("/notes/".length).length == 0
    //console.log(location.pathname)
    useEffect(
        () => {
            //console.log("setting: " + location.pathname)
            if (location.pathname == "/"){
                setSelected(0)
            }
            else if (location.pathname.includes("/about")){
                setSelected(1)
            }
            else { //notes page
                setSelected(2)
                if (noteContent){
                    selectNote(location.pathname)
                }
            }
            //console.log(location)
        }, [location]
    )
    //console.log(shape)
    const navbar = (<>
        <div>
        <Link ref={navRef} className="nav" to="/about" onClick={() => {setSelected(1); setContentY(0)} } onMouseEnter={() => hover(1)} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
            ABOUT
        </Link>
        </div>
        <div>
        <Link ref={navRef} className="nav" to="/" onClick={() => setSelected(0)} onMouseEnter={() => hover(0)} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
            HOME
        </Link>
        </div>
        <div>
        <Link ref={navRef} className="nav" to="/notes" onClick={() => {setSelected(2); setContentY(0)}} onMouseEnter={() => hover(2)} onMouseOut={() => {clearInterval(repeater); setRepeater(null)}}>
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

    let notes_l = 0
    let content_l = -100

    if (selected == 2 && noteContent){
        content_l = 0
        notes_l = 20
    }
    //console.log(noteSelection)

    return <>
        <selectedContext.Provider value={selected}>
            <shapeContext.Provider value={shape}>
                <Canvas style={{transition: '2s', left: l + notes_l + "vw"}}>
                    <Background/>
                </Canvas>
                <div className="leftblur" style={{left: (l - 25)*4+ notes_l + "vw"}}/>
                <div ref={aboutRef} className="content" style={{top: contentY, left: (selected == 1?0: -100) +  "vw", opacity: selected == 1? 1: 0, transition: "0.5s"}}>
                    <div className="content-container">
                        <About/>
                    </div>
                </div>
                <div ref={notesRef} className="content" style={{top: contentY, left: (selected == 2 && !noteContent?0 : -100 ) +  "vw", opacity: selected == 2? 1: 0, transition: "0.5s"}}>
                    <div className="content-container">
                        <div className="content">
                            {buttons(selectNote)}
                        </div>
                        <div ref={contentRef} className="content" style={{width: 80 + "vw", left: content_l +  "vw", marginTop: 0, paddingBottom: "10%"}}>
                            <Notes page={noteSelection} handler={selectNote}/>
                        </div>
                    </div>
                </div>
                <div style={{top: selected != 0? '2vh': '90vh', width: w + "vw", left: 100 - w + "vw"}} className="navbar" ref={navRef}>
                    {navbar}
                </div>
            </shapeContext.Provider>

        </selectedContext.Provider>
    </>
}