import * as THREE from 'three'
import { forwardRef, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

export function lerp(object: { [x: string]: number }, prop: string | number, goal: number, speed = 0.1) {
  object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed)
}

const color = new THREE.Color()
export function lerpC(value: { lerp: (arg0: THREE.Color, arg1: number) => void }, goal: THREE.ColorRepresentation, speed = 0.1) {
  value.lerp(color.set(goal), speed)
}

const vector = new THREE.Vector3()
export function lerpV3(value: { lerp: (arg0: THREE.Vector3, arg1: number) => void }, goal: any, speed = 0.1) {
  value.lerp(vector.set(...goal), speed)
}

export function calculateRefractionAngle(incidentAngle: number, glassIor = 2.5, airIor = 1.000293) {
  const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0
  return theta
}

export const Box = forwardRef((props, ref) => {
  const [hovered, hover] = useState(false)
  const inner = useRef(null)

  useFrame(() => {
    lerpC(inner.current.material.emissive, hovered ? 'white' : '#454545', 0.1)
  })

  return (
    <mesh ref={inner} {...props} onPointerEnter={() => hover(true)} onPointerLeave={() => hover(false)} renderOrder={10} scale={1} dispose={null} >
      <boxGeometry/>
      <meshStandardMaterial />
    </mesh>
  )
})
