import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three-stdlib'

export function Prism2() {
  const { nodes } = useLoader(GLTFLoader, 'https://uploads.codesandbox.io/uploads/user/b3e56831-8b98-4fee-b941-0e27f39883ab/xxpI-prism.glb')
  return (
    <group>
      {/* A low-res, invisible representation of the prism that gets hit by the raycaster */}
      {/* The visible hi-res prism */}
      <mesh position={[0, 0, 0.6]} renderOrder={10} scale={2} dispose={null} geometry={nodes.Cone.geometry}>
        <meshPhysicalMaterial clearcoat={1} clearcoatRoughness={0} transmission={1} thickness={0.9} roughness={0} toneMapped={false} />
      </mesh>
    </group>
  )
}



