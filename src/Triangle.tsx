import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber"
import { computeMorphedAttributes } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { shapeContext } from "./ShapeContext";

const maxDist = 0.08
const minDist = -0.01
const hoverSpeed = 0.3
const returnSpeed = 0.1
const transition_speed = 0.5

const black = new THREE.Color('black')
const white = new THREE.Color('white')
const dBlue = new THREE.Color(0x000088)
const lBlue = new THREE.Color(0x0000f0)

const base = new THREE.Vector3()
function calculateNormals({tri_vertices}:{tri_vertices: Float32Array}){
    const ab = new THREE.Vector3(tri_vertices[3] - tri_vertices[0], tri_vertices[4] - tri_vertices[1], tri_vertices[5] - tri_vertices[2])
    const ac = new THREE.Vector3(tri_vertices[6] - tri_vertices[0], tri_vertices[7] - tri_vertices[1], tri_vertices[8] - tri_vertices[2])
    const norm = base.crossVectors(ab, ac).normalize().toArray()
    return new Float32Array([norm[0],norm[1],norm[2],norm[0],norm[1],norm[2],norm[0],norm[1],norm[2]])
}

function getEdges({tri_vertices}:{tri_vertices: Float32Array})  {
    const tri_edges = new Float32Array(tri_vertices.length*2)
    for (let i = 0; i < tri_vertices.length; i+=9){
        for (let j = 0; j < 9; j++){
            tri_edges[i*2 + j] = tri_vertices[i + j]
            tri_edges[i*2 + j + 9] = tri_vertices[i + j]
        }
    }
    return tri_edges
}

export default function Triangle({sphere_vertices, cube_vertices, torus_vertices, data_key}: {sphere_vertices: Float32Array, cube_vertices: Float32Array, torus_vertices: Float32Array, data_key:number}) {
    //console.log(tri_vertices)
    const [normal, setNormal] = useState<THREE.Vector3 | null>(null)
    const [tValue, setTValue] = useState(minDist)
    const [hovered, setHovered] = useState(false)
    const [edges, setEdges] = useState<THREE.WireframeGeometry | undefined>()
    const [startTimes, setStartTimes] = useState([0,0,0])
    const [prevShape, setPrevShape] = useState(0)

    const shape = useContext(shapeContext)
    const prevShapeRef = useRef<number>(0)

    const geom = useRef<THREE.BufferGeometry>(null)
    const meshRef = useRef(null)
    const edge = useRef(null)

    const state = useThree()
    useLayoutEffect(() => {
        meshRef.current.updateMorphTargets();
        edge.current.updateMorphTargets();
      }, []);
      
    useEffect(
        () => {
            const newStartTimes=[...startTimes]
            newStartTimes[shape] = state.clock.getElapsedTime()
            setStartTimes(newStartTimes)
            setPrevShape(prevShapeRef.current)
            prevShapeRef.current = shape
            //console.log("updated")
        }, [shape]
    )

    function setupNormals(buff_geo: THREE.BufferGeometry<THREE.NormalBufferAttributes>){
        const torus_normals = calculateNormals({tri_vertices:torus_vertices})
        const cube_normals = calculateNormals({tri_vertices:cube_vertices})

        buff_geo.morphAttributes.position = []
        buff_geo.morphAttributes.position[0] = new THREE.Float32BufferAttribute(torus_vertices, 3)
        buff_geo.morphAttributes.position[1] = new THREE.Float32BufferAttribute(cube_vertices, 3)

        buff_geo.morphAttributes.normal = []
        buff_geo.morphAttributes.normal[0] = new THREE.Float32BufferAttribute(torus_normals, 3)
        buff_geo.morphAttributes.normal[1] = new THREE.Float32BufferAttribute(cube_normals, 3)

        buff_geo.computeVertexNormals()
        buff_geo.normalizeNormals()

        const edge_geo = new THREE.WireframeGeometry()
        const sphere_edges = getEdges({tri_vertices: sphere_vertices})
        const cube_edges = getEdges({tri_vertices: cube_vertices})
        const torus_edges = getEdges({tri_vertices: torus_vertices})
        edge_geo.setAttribute('position', new THREE.BufferAttribute(sphere_edges, 3))


        edge_geo.morphAttributes.position = []
        edge_geo.morphAttributes.position[0] = new THREE.Float32BufferAttribute(torus_edges, 3)
        edge_geo.morphAttributes.position[1] = new THREE.Float32BufferAttribute(cube_edges, 3)

        
        setEdges(edge_geo)

        const new_normal = new THREE.Vector3(buff_geo.attributes.normal.array[0], buff_geo.attributes.normal.array[1], buff_geo.attributes.normal.array[2])
        setNormal(new_normal)
        //console.log("setted normals!")
    }

    //animate
    useFrame(
        (state, delta) => {
            //likeness to torus
            let t0 = 0

            //likeness to cube
            let t1 = 0

            const st = startTimes[shape]

            if (shape == 0){
                const w_s = Math.min(1, 1*(state.clock.getElapsedTime() - startTimes[0]))
                let w_t = 0
                let w_c = 0

                if (startTimes[1] > startTimes[2]){
                    w_t = Math.min(1-w_s, startTimes[0] - startTimes[1])
                    w_c = 1 - w_s - w_t
                }
                else{
                    w_c = Math.min(1-w_s, startTimes[0] - startTimes[2])
                    w_t = 1 - w_s - w_c
                }

                t0 = w_t
                t1 = w_c
            }
            else if (shape == 1){
                const w_t = Math.min(1, 1*(state.clock.getElapsedTime() - startTimes[1]))
                let w_s = 0
                let w_c = 0

                if (startTimes[0] > startTimes[2]){
                    w_s = Math.min(1-w_t, startTimes[1] - startTimes[0])
                    w_c = 1 - w_s - w_t
                }
                else{
                    w_c = Math.min(1-w_t, startTimes[1] - startTimes[2])
                    w_s = 1 - w_c - w_t
                }

                t0 = w_t
                t1 = w_c
            }
            else {
                const w_c = Math.min(1, 1*(state.clock.getElapsedTime() - startTimes[2]))
                let w_s = 0
                let w_t = 0

                if (startTimes[0] > startTimes[1]){
                    w_s = Math.min(1-w_c, startTimes[2] - startTimes[0])
                    w_t = 1 - w_s - w_c
                }
                else{
                    w_t = Math.min(1-w_c, startTimes[2] - startTimes[1])
                    w_s = 1 - w_c - w_t
                }

                t0 = w_t
                t1 = w_c
            }

            if (state.clock.getElapsedTime() - startTimes[shape] < 1 && meshRef.current.morphTargetInfluences && edge.current.morphTargetInfluences){

                meshRef.current.morphTargetInfluences[0] = Math.min(Math.max(0, t0), 1)
                meshRef.current.morphTargetInfluences[1] = Math.min(Math.max(0, t1), 1)

                edge.current.morphTargetInfluences[0] = Math.min(Math.max(0, t0), 1)
                edge.current.morphTargetInfluences[1] = Math.min(Math.max(0, t1), 1)
            }

            if (edge.current.morphTargetInfluences){
                edge.current.morphTargetInfluences[0] = Math.min(Math.max(0, t0), 1)
                edge.current.morphTargetInfluences[1] = Math.min(Math.max(0, t1), 1)
            }
            if (hovered){
                const new_norm = calculateNormals({tri_vertices: computeMorphedAttributes(meshRef.current).morphedPositionAttribute.array})
                setNormal(new THREE.Vector3(new_norm[0], new_norm[1], new_norm[2]))
                edge.current.material.color = white
                meshRef.current.material.emissive = lBlue
            }
            else{
                edge.current.material.color = black
                meshRef.current.material.emissive = black
            }


            if (hovered && tValue < maxDist){
                setTValue(Math.min(maxDist, tValue + delta * hoverSpeed))
            }
            else if (tValue > minDist){
                setTValue(Math.max(minDist, tValue - delta * returnSpeed))
            }

        }
        
    )

    const currPosition = new THREE.Vector3(0,0,0)
    if (normal){
        currPosition.copy(normal)
        currPosition.multiplyScalar(tValue)
    }
    return (<>
    <mesh 
        ref={meshRef}
        position={currPosition} 
        onPointerEnter={(event) => {event.stopPropagation(); setHovered(true)}} 
        onPointerLeave={(event) => {event.stopPropagation(); setHovered(false)}}
    >   
        <bufferGeometry ref={geom}  onUpdate={self => setupNormals(self) } >
            <bufferAttribute
                attach='attributes-position'
                array={sphere_vertices}
                count={3}
                itemSize={3}
            />
        </bufferGeometry>

        <meshStandardMaterial color={0x000088} side={THREE.DoubleSide} roughness={0} />
    </mesh>
    <lineSegments ref={edge} position={currPosition} args={[edges, new THREE.LineBasicMaterial({color: 'black', side:THREE.DoubleSide})]}/>
    </>
    )
}