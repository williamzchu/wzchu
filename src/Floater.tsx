import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import {Color, DoubleSide } from "three"

const size = 0.1
const vertices = new Float32Array([size,0,0,0,size,0,0,0,size])
const lBlue = new Color(0x0000f0)
const speed = 0.02
export default function Floater(props: any){
    const ref = useRef(null)

    useFrame(
        (_, delta) => {
            const x = ref.current.position.x
            const z = ref.current.position.z
            const s = Math.sin(delta * speed)
            const c = Math.cos(delta * speed)
            ref.current.position.x = c * x - s * z
            ref.current.position.z = s * x + c * z
        }
    )

    
    function setupNormals(buff: THREE.BufferGeometry<THREE.NormalBufferAttributes>){
        buff.computeVertexNormals()
        buff.normalizeNormals()
    }
    return (
        <mesh {...props}  ref={ref}>
            <bufferGeometry onUpdate={self => setupNormals(self)}>
                <bufferAttribute
                    attach='attributes-position'
                    array={vertices}
                    count={vertices.length / 3}
                    itemSize={3}>
                </bufferAttribute>
            </bufferGeometry>
            <meshStandardMaterial side={DoubleSide} emissive={lBlue} emissiveIntensity={0.5} color={'white'} roughness={0}/>
        </mesh>

    )
}