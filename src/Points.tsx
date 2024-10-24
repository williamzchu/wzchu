import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"

const moveThreshold = 0.01

export default function Point(props){
    const { viewport, pointer, camera } = useThree()
    // This reference will give us direct access to the mesh
    const meshRef = useRef()
    // Set up state for the hovered and active state
    const [selected, setSelected] = useState(false)
    const [mouseX, setMouseX] = useState(0)
    const [mouseY, setMouseY] = useState(0)
    const [x, setX] = useState(0)
    const [y, setY] = useState(0)

    useEffect(
        () => {
            setX(meshRef.current.position.x)
            setY(meshRef.current.position.y)
            //console.log(x,y)
        }, 
    )

    useFrame(
        ({pointer, camera}) => {
            if (selected && (Math.abs(mouseX - pointer.x) > moveThreshold || Math.abs(mouseY - pointer.y) > moveThreshold)){
                const x = (pointer.x * viewport.width) / 2 + camera.position.x
                const y = (pointer.y * viewport.height) / 2 + camera.position.y
                //console.log(pointer)
                meshRef.current.position.set(x, y, 0)
                //console.log(camera.position)
            }
        }
    )

    // Subscribe this component to the render-loop, rotate the mesh every frame
    // Return view, these are regular three.js elements expressed in JSX
    function select(){
        setSelected(true)
        setMouseX(pointer.x)
        setMouseY(pointer.y)
    }

    function deselect(){
        setSelected(false)
        if (Math.abs(mouseX - pointer.x) > moveThreshold  || Math.abs(mouseY - pointer.y) > moveThreshold){
            console.log("moved")
        }
        else{
            console.log("pressed")
        }

    }
    
    return (
        <mesh
        {...props}
        ref={meshRef}
        onPointerDown={e => {e.stopPropagation(); select()}}
        onPointerUp={() => {deselect()}}
        >
        <circleGeometry args={[1, 30]} />
        <meshStandardMaterial color={ 'blue'} />
        </mesh>
    )
}