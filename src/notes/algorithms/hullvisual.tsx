import { Environment, Lightformer, Line, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";

const moveThreshold = 0.01
const black = new THREE.Color('black')
const white = new THREE.Color('white')
const dBlue = new THREE.Color(0x000088)
const lBlue = new THREE.Color(0x0000f0)
const initialN = 5

const lineMat = new THREE.LineBasicMaterial({
	color: 0x0000ff
});

function Edge({vertices}) {
    const lineRef = useRef()
    return (
        <lineSegments >
            <bufferGeometry>
                <bufferAttribute attach={"attributes-position"} array={vertices} count={vertices.length/3} itemSize={3}/>
            </bufferGeometry>
            <lineBasicMaterial attach={"material"} color={'white'} side={THREE.DoubleSide}/>
        </lineSegments>

    )
}

function Point(props){
    const { viewport, pointer, camera } = useThree()
    // This reference will give us direct access to the mesh
    const meshRef = useRef()
    // Set up state for the hovered and active state
    const [selected, setSelected] = useState(false)
    const [mouseX, setMouseX] = useState(0)
    const [mouseY, setMouseY] = useState(0)
    const [color, setColor] = useState(dBlue)

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
            props.update(props.dkey, x,y)
        }
        else{
            props.remove(props.dkey)
        }

    }
    
    return (
        <mesh
        {...props}
        ref={meshRef}
        onPointerDown={(event) => {event.button == 0? select(): null; event.stopPropagation()}}
        onPointerUp={(event) => {deselect();}}
        onPointerEnter={() => setColor(lBlue)}
        onPointerLeave={() => setColor(dBlue)}
        >
        <circleGeometry args={[0.2, 30]} />
        <meshStandardMaterial color={color} />
        </mesh>
    )
}

export default function HullVisual(){
    
    //const {mouse} = useThree()
    const {pointer, viewport, camera} = useThree()
    const [points, setPoints] = useState([] as ReactElement[])
    const [pointCoords, setPointCoords] = useState(new Map())
    const [last, setLast] = useState(0)

    const pointsRef = useRef<THREE.Group>(new THREE.Group)

    useEffect(
        () => {
            const initialPoints = []
            for (let i = 0; i < initialN; i++){
                const xrand = (Math.random() - 0.5)/2 * viewport.width
                const yrand = (Math.random() - 0.5)/2 * viewport.height

                initialPoints.push(<Point key={i} position={[xrand, yrand, 0]} dkey={i} remove={removePoint} update={updatePoint}/>)
            }
            setPoints(initialPoints)
            setLast(initialN + 1)
        }, []
    )

    const vertices = new Float32Array( [
        0, 0,   // v0
         1.0, 1.0,   // v1
         1.0, 1.0,   // v0
         1.0, 0, // v1
    ] );

    const removePoint = (key: string | null) => {setPoints(prev => prev.filter(p => p.key != key))}
    const updatePoint = (key: any, x: any,y: any) => {setPointCoords(new Map(pointCoords).set(key, [x,y]))}

    for (let i = 0 ; i < pointsRef.current.children.length; i++){
        console.log(pointsRef.current.children[i])
    }

    function createPoint(position: number[]){
        setPoints( prev => [...prev, <Point key={last} position={position} dkey={last} remove={removePoint} update={updatePoint}/>])
        setLast(last => last + 1)
    }
    
    function drawHull(){
        
    }

    //console.log(pointCoords)
    //console.log(points)
    //points.forEach((p) => console.log(p.current))
    return (
        <>
            <ambientLight intensity={1} />
            <group ref={pointsRef} onPointerMissed={() => createPoint([pointer.x * viewport.width/2 + camera.position.x, pointer.y * viewport.height/2 + camera.position.y, 0])}>
                {points}
            </group>


            <OrbitControls enablePan={true} enableZoom={false} enableRotate={false}/>
            <OrthographicCamera
                makeDefault
                zoom={50}
                near={1}
                far={300}
                position={[0, 0, 100]}
            />
        </>
    )
}