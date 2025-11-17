import { MeshRefractionMaterial } from '@react-three/drei';
import { useRef, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three'


export function lerp(object: { [x: string]: number; }, prop: string | number, goal: number, speed = 0.1) {
    object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed)
}

const color = new THREE.Color()
export function lerpC(value: { lerp: (arg0: THREE.Color, arg1: number) => void; }, goal: THREE.ColorRepresentation, speed = 0.1) {
  value.lerp(color.set(goal), speed)
}

export function Prism({ref, ...props}){
    const [hovered, hover] = useState(false)
    const inner = useRef(null)

    const length = 4, width = 1;

    let offset_x = length/2
    let offset_y = width/2

    const shape = new THREE.Shape();
    shape.moveTo( -offset_x, -offset_y );
    shape.lineTo( -offset_x, width -offset_y );
    shape.lineTo( length-offset_x, width -offset_y );
    shape.lineTo( length-offset_x, -offset_y );
    shape.lineTo( -offset_x, -offset_y  );
    
    const extrudeSettings = {
        steps: 1,
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 1,
        bevelSegments: 1
    };
    
    useFrame((props, ref)=>{
        lerpC(inner.current.material.emissive, hovered? 'gray' : 'black', 0.1)
    })


    return (
        <mesh {...props} ref={inner} onPointerEnter={(e) => hover(true) } onPointerOut={(e) => hover(false)} renderOrder={10} scale={0.3} dispose={null} >
            <extrudeGeometry args={[shape, extrudeSettings]}/>
            <meshPhysicalMaterial color="#FFFFFF" clearcoat={1} clearcoatRoughness={0} transmission={1} thickness={0} roughness={0} metalness={1} toneMapped={false} />
        </mesh>
    )
}