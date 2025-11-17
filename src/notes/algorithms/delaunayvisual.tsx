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
const trianglePadding = 0.5

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
                const x = (pointer.x * viewport.width) / (camera.zoom/25) + camera.position.x
                const y = (pointer.y * viewport.height) / (camera.zoom/25) + camera.position.y
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
        onPointerEnter={() => {setColor(lBlue)}}
        onPointerLeave={() => setColor(dBlue)}
        >
        <circleGeometry args={[0.2, 30]} /> 
        <meshStandardMaterial color={props.superTriangle? white:color} />
        </mesh>
    )
}

class p{
    x: number
    y: number
    isSuper: boolean

    constructor(x: number,y: number, isSuper:boolean = false){
        this.x = x
        this.y = y
        this.isSuper = isSuper
    }
}
class e{
    start: p
    end: p
    isSuper: boolean

    constructor(start: p, end: p , isSuper:boolean = false){
        this.start = start
        this.end = end
        this.isSuper = isSuper
    }

    reversed(){
        return new e(this.end, this.start)
    }
}

function determinant(matrix: number[][]){
    return (matrix[0][0] * (matrix[1][1] * matrix[2][2] * matrix[3][3] +
                matrix[1][2] * matrix[2][3] * matrix[3][1] +
                matrix[1][3] * matrix[2][1] * matrix[3][2] -
                matrix[1][3] * matrix[2][2] * matrix[3][1] -
                matrix[1][1] * matrix[2][3] * matrix[3][2] -
                matrix[1][2] * matrix[2][1] * matrix[3][3]) -
            matrix[0][1] * (matrix[1][0] * matrix[2][2] * matrix[3][3] +
                matrix[1][2] * matrix[2][3] * matrix[3][0] +
                matrix[1][3] * matrix[2][0] * matrix[3][2] -
                matrix[1][3] * matrix[2][2] * matrix[3][0] -
                matrix[1][0] * matrix[2][3] * matrix[3][2] -
                matrix[1][2] * matrix[2][0] * matrix[3][3]) +
            matrix[0][2] * (matrix[1][0] * matrix[2][1] * matrix[3][3] +
                matrix[1][1] * matrix[2][3] * matrix[3][0] +
                matrix[1][3] * matrix[2][0] * matrix[3][1] -
                matrix[1][3] * matrix[2][1] * matrix[3][0] -
                matrix[1][0] * matrix[2][3] * matrix[3][1] -
                matrix[1][1] * matrix[2][0] * matrix[3][3]) -
            matrix[0][3] * (matrix[1][0] * matrix[2][1] * matrix[3][2] +
                matrix[1][1] * matrix[2][2] * matrix[3][0] +
                matrix[1][2] * matrix[2][0] * matrix[3][1] -
                matrix[1][2] * matrix[2][1] * matrix[3][0] -
                matrix[1][0] * matrix[2][2] * matrix[3][1] -
                matrix[1][1] * matrix[2][0] * matrix[3][2]))
        }

class t{
    p0: p
    p1: p
    p2: p
    isSuper: boolean


    constructor(p0: p, p1: p, p2: p, isSuper:boolean = false){
        this.p0 = p0
        this.p1 = p1
        this.p2 = p2
        this.isSuper = isSuper
    }

    edges(){
        return [new e(this.p0, this.p1), new e(this.p1, this.p2), new e(this.p2, this.p0)]
    }

    sign(p1: p, p2: p, p3:p){
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
    }

    contains(point: p){
        const sign0 = this.sign(p, this.p0, this.p1)
        const sign1 = this.sign(p, this.p1, this.p2)
        const sign2 = this.sign(p, this.p2, this.p0)

        const neg = sign0 < 0 || sign1 < 0 || sign2 < 0
        const pos = sign0 > 0 || sign1 > 0 || sign2 > 0

        return !(neg && pos)
    }

    circumcircleContains(point: p){
        const matrix = [[this.p0.x, this.p0.y, this.p0.x**2 + this.p0.y**2, 1],
                        [this.p1.x, this.p1.y, this.p1.x**2 + this.p1.y**2, 1],
                        [this.p2.x, this.p2.y, this.p2.x**2 + this.p2.y**2, 1],
                        [point.x, point.y, point.x**2 + point.y**2, 1]]

        return determinant(matrix) > 0
    }
}

function addEdgeIfNotShared(hole: Set<unknown>, alreadySeen: Set<unknown>, e: e){
    const er = e.reversed()
    if (alreadySeen.has(e) || alreadySeen.has(er)){
        return
    }
    if (hole.has(e)){
        hole.delete(e)
        alreadySeen.add(e)
        return
    }
    if (hole.has(er)){
        hole.delete(e)
        alreadySeen.add(er)
        return
    }
    hole.add(e)
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
        const initialPoints = []
        initialPoints.push(<Point key={0} position={[-1, 0, 0]} dkey={0} remove={removePoint} />)
        initialPoints.push(<Point key={1} position={[1, 0, 0]} dkey={1} remove={removePoint} />)
        initialPoints.push(<Point key={2} position={[0, 1, 0]} dkey={2} remove={removePoint} />)

        setPoints(initialPoints)
        setLast(() => 3)

        //delaunay(points)
    }, [])


    function delaunay(input_points: any[]){
        //make nicer list
        const points: p[] = []
        for (let i = 0; i < input_points.length; i++){
            if (!input_points[i].props.superTriangle){
                const x = input_points[i].props.position[0]
                const y = input_points[i].props.position[1]
                points.push(new p(x,y))
            }
        }
        console.log(points)

        // find maximas to generate "super triangle" to surround all points
        var minX = Infinity
        var minY = Infinity
        var maxX = -Infinity
        var maxY = -Infinity
        points.forEach(p => {
            minX = Math.min(minX, p.x - trianglePadding)
            minY = Math.min(minY, p.y - trianglePadding)
            maxX = Math.max(maxX, p.x + trianglePadding)
            maxY = Math.max(maxY, p.y + trianglePadding)
        })
        console.log(minX, minY, maxX, maxY)
        console.log(last)
        //create super triangle
        const dx = maxX - minX
        const dy = maxY - minY
        const supTriBotLeft = new p((minX+maxX)/2 -dx, minY, true)
        const supTriBotRight = new p((minX+maxX)/2 +dx, minY, true)
        const supTriTopMid = new p((minX+maxX)/2, maxY + dy, true)
        setPoints( prev => [...prev.filter((e) => !e.props.superTriangle), 
            <Point key={last} position={[supTriBotLeft.x, supTriBotLeft.y, 0]} dkey={last} remove={removePoint} superTriangle={true}/>,
            <Point key={last+1} position={[supTriBotRight.x, supTriBotRight.y, 0]} dkey={last} remove={removePoint} superTriangle={true}/>,
            <Point key={last+2} position={[supTriTopMid.x, supTriTopMid.y, 0]} dkey={last} remove={removePoint} superTriangle={true}/>
        ])
        setLast(last => last + 3)
        const superTriangle = new t(supTriTopMid, supTriBotLeft, supTriBotRight)

        //console.log(superTriangle)
        //console.log(superTriangle.circumcircleContains(new p(0, -1)))

        const triangulation = new Set<t>()
        triangulation.add(superTriangle)

        for (let i = 0; i < points.length; i++){
            const badTriangles = []

            for (const tri of triangulation){
                if (tri.circumcircleContains(points[i])){
                    badTriangles.push(tri)
                }
            }

            const polygonHole = new Set()
            const dupeEdges = new Set()

            for (const tri of badTriangles){
                for (const edge of tri.edges()){
                    addEdgeIfNotShared(polygonHole, dupeEdges, edge)
                }
            }
            console.log(polygonHole)
        }

    }
    //console.log(points)
    return (<>
        <group ref={pointsRef} onPointerMissed={() =>  createPoint([pointer.x * viewport.width/(camera.zoom/25) + camera.position.x, pointer.y * viewport.height/(camera.zoom/25) + camera.position.y, 0]) }>
            {points}
        </group>
        
        <ambientLight intensity={1} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={false}/>
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