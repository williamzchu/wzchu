import { OrbitControls, OrthographicCamera } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { createContext, forwardRef, ReactElement, useContext, useEffect, useRef, useState } from "react"
import * as THREE from "three"

const moveThreshold = 0.01
const black = new THREE.Color('black')
const white = new THREE.Color('white')
const dBlue = new THREE.Color(0x000088)
const lBlue = new THREE.Color(0x0000f0)
const initialN = 5

const stepContext = createContext(-1)

function Point(props){
    const { viewport, pointer, camera } = useThree()
    // This reference will give us direct access to the mesh
    const meshRef = useRef()
    // Set up state for the hovered and active state
    const [selected, setSelected] = useState(false)
    const [mouseX, setMouseX] = useState(0)
    const [mouseY, setMouseY] = useState(0)
    const [color, setColor] = useState(dBlue)

    const step = useContext(stepContext)

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
            const x = (pointer.x * viewport.width) / 2 + camera.position.x
            const y = (pointer.y * viewport.height) / 2 + camera.position.y
        }
        else{
            props.remove(props.dkey)
        }

    }
    
    return (
        <mesh
        {...props}
        ref={meshRef}
        onPointerDown={(event) => {event.button == 0 && step == -1? select(): null; event.stopPropagation()}}
        onPointerUp={(event) => {deselect();}}
        onPointerEnter={() => {setColor(lBlue);}}
        onPointerLeave={() => setColor(dBlue)}
        >
        <circleGeometry args={[0.2, 30]} />
        <meshStandardMaterial color={color} />
        </mesh>
    )
}

class p{
    x: number
    y: number

    constructor(x: number,y: number){
        this.x = x
        this.y = y
    }
}
class e{
    start: p
    end: p

    constructor(start: p, end: p){
        this.start = start
        this.end = end
    }
}
class t{
    p0: p
    p1: p
    p2: p

    constructor(p0: p, p1: p, p2: p){
        this.p0 = p0
        this.p1 = p1
        this.p2 = p2
    }

}


const DelaunayVisual = forwardRef((props, ref) => {
    const {pointer, viewport, camera} = useThree()
    const [points, setPoints] = useState([] as ReactElement[])
    const [last, setLast] = useState(0)

    const pointsRef = useRef<THREE.Group>(new THREE.Group)

    function createPoint(position: number[]){
        setPoints( prev => [...prev, <Point key={last} position={position} dkey={last} remove={removePoint}/>])
        setLast(last => last + 1)
    }

    const removePoint = (key: string | null) => {setPoints(prev => prev.filter(p => p.key != key))}

    useEffect(() => {
        let p1 = new p(0,1)
        console.log(p1)
    })

    function delaunay(points: any[]){

    }

    return (<>
        <group ref={pointsRef} onPointerMissed={() =>  createPoint([pointer.x * viewport.width/2 + camera.position.x, pointer.y * viewport.height/2 + camera.position.y, 0]) }>
            {points}
        </group>
        
        <ambientLight intensity={1} />
        <OrbitControls enablePan={true} enableZoom={false} enableRotate={false}/>
        <OrthographicCamera
            makeDefault
            zoom={50}
            near={1}
            far={300}
            position={[0, 0, 100]}
        />
    </>)
})

export default DelaunayVisual