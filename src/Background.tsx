import { Environment, Html, Lightformer, MeshDiscardMaterial, OrbitControls, Wireframe } from "@react-three/drei"
import { useEffect, useRef, useState, ReactElement, useContext } from "react"
import { Perf } from 'r3f-perf'
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import Triangle  from './Triangle.tsx'
import Floater from "./Floater.tsx"
import './index.css'
import { shapeContext } from "./ShapeContext.tsx"
import { selectedContext } from "./SelectedContext.tsx"

const swirlRadius = 15

//vertices for sphere
const sphere_vertices = new THREE.IcosahedronGeometry(1,4).attributes.position.array

//vertcies for cube
const box = new THREE.BoxGeometry(2,2,2,6,6,6)
box.rotateX(Math.PI/4)
box.rotateZ(Math.PI/4)
const cube_vertices = new Float32Array(box.index.array.length * 3)
for (let i = 0; i < box.index?.array.length; i++){
    const index = box.index.array[i]
    cube_vertices[i * 3] = box.attributes.position.array[index * 3]
    cube_vertices[i * 3 + 1] = box.attributes.position.array[index * 3 + 1]
    cube_vertices[i * 3 + 2] = box.attributes.position.array[index * 3 + 2]
}
randomize({triangle_vertices:cube_vertices})

//vertices for torus
const torus = new THREE.TorusKnotGeometry(1, 0.3,32, 7, 3, 5)
const torus_vertices = new Float32Array(torus.index.array.length * 3)
for (let i = 0; i < torus.index?.array.length; i++){
    const index = torus.index.array[i]
    torus_vertices[i * 3] = torus.attributes.position.array[index * 3]
    torus_vertices[i * 3 + 1] = torus.attributes.position.array[index * 3 + 1]
    torus_vertices[i * 3 + 2] = torus.attributes.position.array[index * 3 + 2]
}
randomize({triangle_vertices:torus_vertices})


//randomize triangle order using fisher yates
function randomize({triangle_vertices}:{triangle_vertices: Float32Array}){
    const n = triangle_vertices.length / 9
    for (let i = 0; i < n; i++){
        const rand_int = Math.floor(Math.random() * (n-i)) + i
        const effective_i = i * 9 
        const effective_j = rand_int * 9

        //swap vertices
        for (let j = 0; j < 9; j++){
            const temp = triangle_vertices[effective_j + j]
            triangle_vertices[effective_j + j] = triangle_vertices[effective_i + j]
            triangle_vertices[effective_i + j] = temp
        }
    }
}


export default function Background(){
    const [triangles, setTriangles] = useState([] as ReactElement[])
    const [floaters, setFloaters] = useState([] as ReactElement[])
    const trianglesRef = useRef<THREE.Group>(null)
    const groupRef = useRef<THREE.Group>(null)
    const lightGroup = useRef(null)

    const shape = useContext(shapeContext)
    const selected = useContext(selectedContext)

    useFrame(
        (state, delta) => {
            if (trianglesRef.current){
                trianglesRef.current.rotation.y += delta/10
            }
            const angle = state.camera.rotation.y
            const c = Math.cos(angle)
            const s = Math.sin(angle)
            const d = ((1/(1+2**(-state.pointer.x*8)))-0.5)/2
            
            if (selected == 0){
                if (state.camera.position.z > 0){
                    groupRef.current.position.x = c * d
                    groupRef.current.position.z = -s * d
                }
                else{
                    groupRef.current.position.x = -c * d
                    groupRef.current.position.z = -s * d
                }
                groupRef.current.position.y = state.pointer.y/2
            }
            else if (selected == 1){

            }

            if (selected == 0){
                if (groupRef.current.rotation.x > 0){
                    groupRef.current.rotation.x = Math.max(0, groupRef.current.rotation.x - delta*2)
                }
                else{
                    groupRef.current.rotation.x = Math.min(0, groupRef.current.rotation.x + delta*2)
                }
            }
            else if (selected == 1){
                groupRef.current.rotation.x = Math.max(-Math.PI/2, groupRef.current.rotation.x - delta*2)
            }
            else if (selected == 2){
                groupRef.current.rotation.x = Math.min(Math.PI/2, groupRef.current.rotation.x + delta*2)
            }
            

        }
    )

    useEffect(
        () => {
            const newFloaters = []
            const numFloaters = 100
            for(let i = 0; i < numFloaters; i++)
            {
                const radius = Math.random() * swirlRadius + 2
                const branchAngle = (i % numFloaters) / numFloaters * Math.PI * 2
                
                const floater = <Floater radius={radius} key={i} rotation={[Math.cos(branchAngle) * radius, Math.random() * 2 - 1, Math.sin(branchAngle) * radius]} position={[Math.cos(branchAngle) * radius, swirlRadius*(Math.random() - 0.5), Math.sin(branchAngle) * radius]}/>
                newFloaters.push(floater)
            }
            setFloaters(newFloaters)

            const numVertices = Math.max(sphere_vertices.length, cube_vertices.length, torus_vertices.length )

            const factor = 9
            const numTriangles = numVertices/factor
            const newTriangles = []

            for (let triangleNum = 0; triangleNum < numTriangles; triangleNum++){
                let i = triangleNum * factor

                const s_vertices = new Float32Array(9)
                const c_vertices = new Float32Array(9)
                const t_vertices = new Float32Array(9)
                for (let v = 0; v < 9; v++){
                    s_vertices[v] = sphere_vertices[(i + v)%sphere_vertices.length]
                    c_vertices[v] = cube_vertices[(i + v)%cube_vertices.length]
                    t_vertices[v] = torus_vertices[(i + v)%torus_vertices.length]
                }
                //console.log(tri_vertices)
                const triangleMesh = <Triangle key={triangleNum} cube_vertices={c_vertices} sphere_vertices={s_vertices} torus_vertices={t_vertices} data_key={triangleNum}/>
                //console.log(triangleMesh.props.children[0])
                newTriangles.push(triangleMesh)
                setTriangles(newTriangles)
            }
        },
        [sphere_vertices]
    )
    return <>
        {/*<Perf />*/}
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI*3/5} minPolarAngle={Math.PI*2/5} />
        <group ref={groupRef}>
            <group ref={trianglesRef}>
                {triangles}
            </group>
            {floaters}
        </group>
        
        <Environment resolution={512} blur={1}>
            {/* Ceiling */}
            <group ref={lightGroup}>
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, -9]} scale={[10, 1, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, -6]} scale={[10, 1, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, -3]} scale={[10, 1, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, 0]} scale={[10, 1, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, 3]} scale={[10, 1, 1]} />
                <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 4, 6]} scale={[10, 1, 1]} />
                <Lightformer intensity ={2} rotation-x={Math.PI / 2} position={[0, 4, 9]} scale={[10, 1, 1]} />
                {/* Sides */}
                <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-50, 2, 0]} scale={[100, 2, 1]} />
                <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[50, 2, 0]} scale={[100, 2, 1]} />
                {/* Key */}
                <Lightformer form="ring" intensity={5} scale={5} position={[10, 5, 10]} onUpdate={(self) => self.lookAt(0, 0, 0)} />

                <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[50, 2, 0]} scale={[100, 2, 1]} />
            </group>
        </Environment>
    </>
}