import { Environment, Lightformer, Line, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, forwardRef, ReactElement, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { JSX } from "react/jsx-runtime";
import * as THREE from "three";
import { Sequence } from "three/examples/jsm/libs/tween.module.js";

const moveThreshold = 0.01
const black = new THREE.Color('black')
const white = new THREE.Color('white')
const dBlue = new THREE.Color(0x000088)
const lBlue = new THREE.Color(0x0000f0)
const initialN = 5

const lineMat = new THREE.LineBasicMaterial({
	color: 0x0000ff
});

const lineSpeed = 0.01

const edgeContext = createContext([] as any[])
const stepContext = createContext(-2)

function Edge({vertices, initialState=true, history_key=-2}) {
    const [shown, setShown] = useState(initialState)
    const lineRef = useRef(new THREE.LineSegments)

    //console.log(lineRef.current.geometry)
    const edgeEvent = useContext(edgeContext)

    useFrame((state) => {
        //lineRef.current.morphTargetInfluences[0] += 0.01
        if (!shown && lineRef.current.morphTargetInfluences[0] < 1){
            lineRef.current.morphTargetInfluences[0] = Math.min(1, lineRef.current.morphTargetInfluences[0] + lineSpeed)
        }
        else{
            lineRef.current.morphTargetInfluences[0] = Math.max(0, lineRef.current.morphTargetInfluences[0] - lineSpeed)
        }
    })

    useEffect(
        () => {
            if (history_key == edgeEvent[0]){
                setShown(edgeEvent[1])
            }
            else{
                if (shown){
                    lineRef.current.morphTargetInfluences[0] = 0
                }
                else{
                    lineRef.current.morphTargetInfluences[0] = 1
                }
            }
            //console.log(edgeEvent)
            if (edgeEvent[0] == -2 && history_key != -2){
                setShown(false)
                
            }
        }, [edgeEvent]
    )

    useLayoutEffect(() => {
        lineRef.current.updateMorphTargets();
        lineRef.current.morphTargetInfluences[0] = initialState? 0 : 1
    }, []);

    function setMorph(geom: THREE.BufferGeometry<THREE.NormalBufferAttributes>){
        geom.morphAttributes.position = []
        geom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(new Float32Array([vertices[0],vertices[1],vertices[2],vertices[0],vertices[1],vertices[2]]), 3)
    }

    return (
        <lineSegments ref={lineRef}>
            <bufferGeometry  onUpdate={self => setMorph(self)}>
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

    const step = useContext(stepContext)

    useFrame(
        ({pointer, camera}) => {
            if (selected && (Math.abs(mouseX - pointer.x) > moveThreshold || Math.abs(mouseY - pointer.y) > moveThreshold)){
                const x = ((pointer.x * viewport.width)  / (camera.zoom/25) + camera.position.x)
                const y = ((pointer.y * viewport.height) / (camera.zoom/25) + camera.position.y)
                //console.log(pointer)
                meshRef.current.position.set(x, y, 0)
            }
            //console.log(camera.scale)
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

        }
        else{
            props.remove(props.dkey)
        }

    }
    
    return (
        <mesh
        {...props}
        ref={meshRef}
        onPointerDown={(event) => {event.button == 0 && step == -2? select(): null; event.stopPropagation()}}
        onPointerUp={(event) => {deselect();}}
        onPointerEnter={() => {setColor(lBlue);}}
        onPointerLeave={() => setColor(dBlue)}
        >
        <circleGeometry args={[0.2, 30]} />
        <meshStandardMaterial color={color} />
        </mesh>
    )
}

const HullVisual = forwardRef((props, ref) => {
    
    //const {mouse} = useThree()
    const {pointer, viewport, camera} = useThree()
    const [points, setPoints] = useState([] as ReactElement[])
    const [pointCoords, setPointCoords] = useState(new Map())

    const [edges, setEdges] = useState([] as ReactElement[])
    const [last, setLast] = useState(0)
    const [numEdges, setNumEdges] = useState(0)

    const [history, setHistory] = useState([] as ReactElement[])
    const [edgeStep, setEdgeStep] = useState(-2)
    const [edgeEvent, setEdgeEvent] = useState([] as any[])
    const [historySequence, setHistorySequence] = useState([] as any[])
    const [historyMap, setHistoryMap] = useState(new Map())

    const [animationSelected, setAnimationSelected] = useState(false)

    const pointsRef = useRef<THREE.Group>(new THREE.Group)
    const edgesRef = useRef<THREE.Group>(new THREE.Group)
    const edgeRef = useRef([])

    useImperativeHandle(ref, () => ({

        getPoints() {
          return points;
        },

        updateHull(){
            drawHull()
            setEdgeStep(-2)
            //setEdgeEvent(() => ["all", false])
            setEdgeEvent(() => [-2, true]) //sets initial edges true
        },

        steps(){
            setEdgeEvent([-2, false])
            setEdgeStep(-1)
        },

        next(){
            if (edgeStep + 1 < historySequence.length && edgeStep + 1 >= 0) {
                setEdgeEvent(historySequence[edgeStep + 1])
                setEdgeStep(prev => prev + 1)
            }
        },

        prev(){
            if (edgeStep - 1 < historySequence.length && edgeStep - 1 >= -1) {
                setEdgeEvent([historySequence[edgeStep][0], !historySequence[edgeStep][1]])
                setEdgeStep(prev => prev - 1)
            }
        }

    
      }));

    const calculateHull = () => {
        const meshes = pointsRef.current.children



        let bottom = meshes[0]
        for (let i = 1; i < meshes.length; i++){
            const curr = meshes[i]
            if (curr.position.y < bottom.position.y || curr.position.y == bottom.position.y && curr.position.x < bottom.position.x){
                bottom = curr
            }
        }
        if (!bottom){
            return []
        }
        const meshes2 = meshes.filter(p => p !== bottom)
        meshes2.sort(function(a,b){
            const xa_i2 = (a.position.x - bottom.position.x) * (a.position.x - bottom.position.x)
            const ya_i2 = (a.position.y - bottom.position.y) * (a.position.y - bottom.position.y)
            const cos2a = (a.position.x - bottom.position.x) / Math.sqrt(xa_i2 + ya_i2)

            const xb_i2 = (b.position.x - bottom.position.x) * (b.position.x - bottom.position.x)
            const yb_i2 = (b.position.y - bottom.position.y) * (b.position.y - bottom.position.y)
            const cos2b = (b.position.x - bottom.position.x)/ Math.sqrt(xb_i2 + yb_i2)

            return cos2b - cos2a
        })
        //console.log(meshes2)
        //console.log(meshes2)

        const coords = [[bottom.position.x, bottom.position.y, bottom.dkey], ...meshes2.map((p) => [p.position.x, p.position.y, p.dkey])]

        const stack = []

        function cross(a: number[], b: number[], c: number[]){
            return (b[0] - a[0])*(c[1] - a[1]) - (b[1] - a[1])*(c[0] - a[0])
        }

        const newhistory = []
        const historyMap = new Map()
        let numHistory = 0
        const sequence = []
        for (let i = 0; i < coords.length; i++){
            while (stack.length > 1 && cross(stack[stack.length - 2], stack[stack.length-1], coords[i]) <= 0) {
                newhistory.push([stack[stack.length-1], coords[i]])
                historyMap.set([stack[stack.length-1][2], coords[i][2]].join(','), numHistory)
                numHistory += 1
                sequence.push([historyMap.get([stack[stack.length-1][2], coords[i][2]].join(',')), true])
                sequence.push([historyMap.get([stack[stack.length-1][2], coords[i][2]].join(',')), false])
                sequence.push([historyMap.get([stack[stack.length-2][2], stack[stack.length-1][2]].join(',')), false])
                stack.pop()

            }
            stack.push(coords[i])

            //history
            if (stack.length > 1){
                newhistory.push([stack[stack.length-2], coords[i]])
                historyMap.set([stack[stack.length-2][2], coords[i][2]].join(','), numHistory)
                sequence.push([historyMap.get([stack[stack.length-2][2], coords[i][2]].join(',')), true])
                numHistory += 1
            }
        }

        //console.log("coords", newhistory)
        newhistory.push([stack[stack.length-1], stack[0]])
        historyMap.set([stack[stack.length-1][2],stack[0][2]].join(','), numHistory)
        sequence.push([historyMap.get([stack[stack.length-1][2], stack[0][2]].join(',')), true])

        //console.log(historyMap)
        //console.log(historyMap.keys())
        //console.log([stack[stack.length-1][2],stack[0][2]].join(','), historyMap.get([stack[stack.length-1][2],stack[0][2]].join(',')))
        //console.log(sequence)

        const historyEdges: JSX.Element[] = []
        for (let i = 0; i< newhistory.length; i++){
            const a = newhistory[i][0]
            const b = newhistory[i][1]
            const vertices = new Float32Array(
                [a[0], a[1], 0,  
                b[0], b[1], 0]
            )
            historyEdges.push(<Edge key={numEdges + i} vertices={vertices} history_key={i} initialState={false}></Edge>)
        }
        //console.log(historyEdges)
        setHistory(() => historyEdges)
        setHistorySequence(sequence)
        setHistoryMap(historyMap)
        setNumEdges(prev => prev + historyEdges.length)

        // Clean final edges
        const newEdges: JSX.Element[] = []
        for (let i = 0; i < stack.length; i++){
            const a = i == 0? stack[stack.length-1]: stack[i - 1]
            const b = stack[i]
            const vertices = new Float32Array(
                [a[0], a[1], 0,  
                 b[0], b[1], 0])
            newEdges.push(<Edge key={numEdges + i} vertices={vertices}></Edge>)
        }
        return newEdges
    }
    const drawHull = () => {
        const newEdges = calculateHull()
        setNumEdges(prev => prev + newEdges.length)
        setEdges(() => newEdges)
    }

    useEffect(
        () => {
            const initialPoints = []
            for (let i = 0; i < initialN; i++){
                const xrand = (Math.random() - 0.5)/2 * viewport.width
                const yrand = (Math.random() - 0.5)/2 * viewport.height

                initialPoints.push(<Point key={i} position={[xrand, yrand, 0]} dkey={i} remove={removePoint} update={null}/>)
            }
            setPoints(initialPoints)
            setLast(initialN + 1)
            //console.log(edgeRef)
        }, [edgeRef]
    )


    const removePoint = (key: string | null) => {setPoints(prev => prev.filter(p => p.key != key))}

    function createPoint(position: number[]){
        setPoints( prev => [...prev, <Point key={last} position={position} dkey={last} remove={removePoint} update={null}/>])
        setLast(last => last + 1)
    }

    useFrame(() => {
        if (edgeStep == -2){
            drawHull()
        }
        //console.log(camera.zoom)
    })
    

    //console.log("children", edgesRef.current.children)
    //console.log(historySequence)
    return (
        <>  
            <edgeContext.Provider value={edgeEvent}>
                <stepContext.Provider value={edgeStep}>
                    <ambientLight intensity={1} />
                    <group ref={edgesRef} position={[0,0,-0.001]}>
                        {edges}
                    </group>

                    <group ref={pointsRef} onPointerMissed={() => edgeStep == -2? createPoint([pointer.x * viewport.width / (camera.zoom/25) + camera.position.x, pointer.y * viewport.height /(camera.zoom/25) + camera.position.y, 0]) : null}>
                        {points}
                    </group>

                    <group position={[0,0,-0.001]}>
                        {history}
                    </group>
                    <OrbitControls enablePan={true} enableZoom={true} enableRotate={false}/>
                    <OrthographicCamera
                        makeDefault
                        zoom={50}
                        near={1}
                        far={300}
                        position={[0, 0, 100]}
                    />
                </stepContext.Provider>
            </edgeContext.Provider>
        </>
    )
})

export default HullVisual